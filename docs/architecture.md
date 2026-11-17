# Arquitectura — Vortex Metrics

Documento vivo. Describe las decisiones estructurales del proyecto tal como están
implementadas en el repositorio, y marca explícitamente lo que todavía pertenece a fases
posteriores.

---

## 1. Principios

1. **El tenant nunca lo elige el cliente.** El identificador de organización viaja en la URL
   (`/app/[orgSlug]`) y se resuelve contra una membresía verificada en el servidor.
2. **La autorización se comprueba dos veces.** En la capa de aplicación (guards + matriz de
   permisos) y en la base de datos (Row-Level Security con `FORCE`, Fase 9).
3. **Un fallo de aislamiento debe fallar cerrado.** Si una consulta olvida el filtro de tenant,
   no debe devolver filas de otra organización: RLS devuelve cero filas.
4. **Los números salen de SQL.** KPIs, gráficos y exports comparten las mismas definiciones y
   las mismas consultas parametrizadas. No hay datos mock alimentando el producto.
5. **El dinero es entero.** Todos los importes se guardan en centavos (`*_cents`); el formateo
   ocurre en el borde de la UI.
6. **Todo lo importante deja rastro.** Las mutaciones relevantes escriben en `audit_logs` con
   `before`/`after` a nivel de campo.

---

## 2. Vista de capas

```
┌──────────────────────────────────────────────────────────────────┐
│ UI — React Server Components + islas cliente                     │
│  · Sin reglas de negocio en componentes                          │
│  · TanStack Query para tablas interactivas                       │
│  · Skeletons, estados vacíos y de error explícitos               │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│ Borde HTTP — Server Actions (escrituras) / Route Handlers (lecturas, exports)
│  · Zod: validación de entrada                                    │
│  · Rate limiting respaldado por Postgres                         │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│ Autorización                                                     │
│  · Sesión opaca hasheada → usuario                              │
│  · orgSlug + sesión → Membership → rol                          │
│  · Matriz de permisos (OWNER / ADMIN / MANAGER / VIEWER)         │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│ Acceso a datos                                                   │
│  · Repositorios con `organizationId` como primer argumento       │
│  · SQL parametrizado para analítica                              │
│  · Transacciones para mutaciones multi-tabla                     │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│ PostgreSQL 16                                                    │
│  · Índices compuestos que empiezan por organization_id           │
│  · pg_trgm + GIN para búsqueda ILIKE '%texto%'                   │
│  · RLS con FORCE + políticas por tenant (Fase 9)                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Modelo de datos

14 tablas de aplicación. El esquema completo y comentado vive en
[`prisma/schema.prisma`](../prisma/schema.prisma).

```mermaid
erDiagram
    User ||--o{ Membership : "tiene"
    Organization ||--o{ Membership : "incluye"
    User ||--o{ Session : "abre"
    Organization |o--o{ Session : "org activa"
    User ||--o{ PasswordResetToken : "solicita"
    User ||--o{ Invitation : "invita"
    Organization ||--o{ Invitation : "recibe"
    Organization ||--o{ Category : "define"
    Organization ||--o{ Product : "vende"
    Category |o--o{ Product : "agrupa"
    Organization ||--o{ Customer : "registra"
    Organization ||--o{ Order : "recibe"
    Customer ||--o{ Order : "compra"
    Order ||--o{ OrderItem : "contiene"
    Product ||--o{ OrderItem : "aparece en"
    Organization ||--o{ TrafficDaily : "mide"
    Organization ||--o{ AuditLog : "audita"
    User |o--o{ AuditLog : "actor"

    User {
        string id PK "cuid"
        string email UK
        string name
        string passwordHash
        boolean isDemo
        timestamptz emailVerifiedAt
    }

    Organization {
        string id PK
        string name
        string slug UK "segmento de URL"
        string currency "ISO 4217"
        string timezone
        boolean isDemo
    }

    Membership {
        string id PK
        string userId FK
        string organizationId FK
        enum role "OWNER|ADMIN|MANAGER|VIEWER"
    }

    Session {
        string id PK
        string userId FK
        string tokenHash UK "SHA-256 del token"
        string activeOrganizationId FK
        timestamptz expiresAt
        timestamptz lastUsedAt
        timestamptz revokedAt
        string ip
        string userAgent
    }

    PasswordResetToken {
        string id PK
        string userId FK
        string tokenHash UK
        timestamptz expiresAt
        timestamptz usedAt
    }

    Invitation {
        string id PK
        string organizationId FK
        string email
        enum role
        string tokenHash UK
        string invitedById FK
        timestamptz expiresAt
        timestamptz acceptedAt
        timestamptz revokedAt
    }

    Category {
        string id PK
        string organizationId FK
        string name
    }

    Product {
        string id PK
        string organizationId FK
        string categoryId FK
        string sku
        string name
        int priceCents
        int costCents
        enum status "ACTIVE|ARCHIVED"
    }

    Customer {
        string id PK
        string organizationId FK
        string name
        string email
        string country
    }

    Order {
        string id PK
        string organizationId FK
        string customerId FK
        string number
        enum status "PENDING|PAID|REFUNDED|CANCELLED"
        int subtotalCents
        int discountCents
        int taxCents
        int totalCents
        timestamptz placedAt
    }

    OrderItem {
        string id PK
        string organizationId FK
        string orderId FK
        string productId FK
        int quantity
        int unitPriceCents
        int lineTotalCents
    }

    TrafficDaily {
        string id PK
        string organizationId FK
        date date
        int visitors
        int sessions
    }

    AuditLog {
        string id PK
        string organizationId FK
        string actorId FK
        string action
        string resourceType
        string resourceId
        json before
        json after
        string ip
        string userAgent
        timestamptz createdAt
    }
```

### Convenciones

| Tema | Decisión | Motivo |
| --- | --- | --- |
| IDs | `cuid()` | Seguros en URL, no secuenciales, sin colisiones entre tenants |
| Dinero | `Int` en centavos | Evita errores de coma flotante; el formateo es de presentación |
| Timestamps | `timestamptz(3)` | Siempre UTC, precisión de milisegundos |
| Nombres | `snake_case` en Postgres, `camelCase` en Prisma | Convención SQL natural sin renombrar en cada consulta |
| Relaciones | FK + `onDelete` explícito | `Cascade` para datos de tenant, `Restrict`/`SetNull` cuando el histórico importa |
| Unicidad | Siempre compuesta con `organizationId` | Dos tenants pueden tener el mismo SKU, email de cliente o número de pedido |
| `OrderItem` | Guarda `organizationId` propio | Permite filtrar y validar sin `JOIN` y bloquea líneas cruzadas entre tenants |

### Por qué `organizationId` también en `OrderItem`

Es redundante respecto a `orders.organization_id`, pero deliberado:

- Los agregados de productos por tenant se resuelven con un solo índice.
- RLS puede aplicar una política directa a la tabla sin subconsultas.
- Una línea de pedido nunca puede apuntar a un producto de otra organización sin que la
  comprobación de integridad lo detecte.

---

## 4. Aislamiento multi-tenant

### 4.1 Resolución del tenant

```
GET /app/acme/orders
        │
        ├─ 1. Sesión: cookie httpOnly → hash SHA-256 → sessions.token_hash
        │      (revocada / expirada ⇒ 401 y redirect a /login)
        │
        ├─ 2. Membresía: SELECT ... FROM memberships
        │      WHERE user_id = $1 AND organization_id = (org de slug 'acme')
        │      (sin fila ⇒ 404, nunca 403)
        │
        └─ 3. Contexto de servidor: { user, org, membership.role }
               · orgId no viaja en el body de ninguna acción
               · toda consulta de datos recibe ese orgId
```

El layout de `/app/[orgSlug]` resuelve el contexto una vez y lo pasa a las páginas. Las
Server Actions y Route Handlers **vuelven a resolverlo**: nunca confían en un valor enviado
por el cliente.

### 4.2 Defensa en profundidad

| Capa | Qué impide | Dónde |
| --- | --- | --- |
| Sesión opaca | Robo de sesión persistente, fijación | `sessions` (hash + expiración + revocación) |
| Guard de membresía | Acceso a organizaciones ajenas | Layout y cada acción |
| Matriz de permisos | Escrituras fuera de rol | Servidor, antes de tocar datos |
| Repositorios con `orgId` obligatorio | Olvido del filtro | Firmas de funciones |
| RLS con `FORCE` | Fuga incluso con un `WHERE` olvidado | PostgreSQL (Fase 9) |

`FORCE ROW LEVEL SECURITY` es clave: sin él, el dueño de la tabla (el rol de la aplicación en
Neon) saltaría las políticas.

### 4.3 Respuestas ante fallos

- Recurso de otro tenant: **404** (no revela existencia).
- Sesión inválida o ausente: redirección a `/login?next=…`; las rutas de datos responderán **401**.
- Rol insuficiente dentro del propio tenant: **403**.
- Validación: errores por campo devueltos al formulario (Zod), sin recargar la página.

---

## 5. Roles y permisos

| Acción | Owner | Admin | Manager | Viewer |
| --- | :---: | :---: | :---: | :---: |
| Ver dashboard y analítica | ✅ | ✅ | ✅ | ✅ |
| Ver pedidos, clientes, productos | ✅ | ✅ | ✅ | ✅ |
| Exportar CSV / PDF | ✅ | ✅ | ✅ | ✅ |
| Crear / editar pedidos y clientes | ✅ | ✅ | ✅ | ❌ |
| Crear / editar productos | ✅ | ✅ | ❌ (solo lectura) | ❌ |
| Gestionar miembros e invitaciones | ✅ | ✅ | ❌ | ❌ |
| Ver audit log | ✅ | ✅ | ❌ | ❌ |
| Cambiar ajustes de la organización | ✅ | ✅ | ❌ | ❌ |
| Modificar al Owner | ❌ (nunca) | ❌ | ❌ | ❌ |
| Eliminar o transferir la organización | ✅ | ❌ | ❌ | ❌ |

Reglas adicionales:

- Un Admin **no** puede degradar, expulsar ni editar al Owner.
- El último Owner no puede abandonar la organización ni degradarse a sí mismo.
- Un usuario no puede cambiar su propio rol.
- La UI oculta acciones no permitidas, pero la decisión real siempre es del servidor.

Las membresías son por organización: un mismo usuario puede ser Owner en un workspace y
Viewer en otro. El selector de organización solo muestra membresías reales.

---

## 6. Índices y rendimiento

### 6.1 Índices compuestos

Todas las consultas de tenant filtran por `organization_id`, así que ese campo va primero:

| Tabla | Índice | Cubre |
| --- | --- | --- |
| `orders` | `(organization_id, placed_at DESC)` | Listado y series temporales |
| `orders` | `(organization_id, status, placed_at DESC)` | Filtro por estado + orden |
| `orders` | `(organization_id, customer_id)` | Pedidos por cliente |
| `customers` | `(organization_id, created_at)` | Crecimiento de clientes |
| `products` | `(organization_id, status)` / `(organization_id, category_id)` | Catálogo y filtros |
| `order_items` | `(organization_id, order_id)` / `(organization_id, product_id)` | Detalle y top productos |
| `audit_logs` | `(organization_id, created_at DESC)` | Timeline de auditoría |
| `audit_logs` | `(organization_id, resource_type, resource_id)` | Historial por recurso |
| `traffic_daily` | `(organization_id, date)` + `UNIQUE` | Conversión diaria |

### 6.2 Búsqueda de texto

`ILIKE '%término%'` no puede usar un B-tree (el comodín inicial lo impide). Por eso:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX customers_name_trgm_idx  ON customers USING GIN (name  gin_trgm_ops);
CREATE INDEX customers_email_trgm_idx ON customers USING GIN (email gin_trgm_ops);
CREATE INDEX products_name_trgm_idx   ON products  USING GIN (name  gin_trgm_ops);
CREATE INDEX products_sku_trgm_idx    ON products  USING GIN (sku   gin_trgm_ops);
CREATE INDEX orders_number_trgm_idx   ON orders    USING GIN (number gin_trgm_ops);
```

Están declarados en `schema.prisma` con `ops: raw("gin_trgm_ops")` para que Prisma no detecte
drift, y la extensión se crea en la migración inicial.

### 6.3 Estrategia de paginación

- Tablas: paginación por offset con `LIMIT`/`OFFSET` acotado y un `COUNT(*)` de la misma
  consulta filtrada (el dataset sembrado es finito y el usuario necesita el total).
- Series temporales: agregación por día/semana/mes con `date_trunc`.
- Comparación de periodos: dos rangos en la misma consulta mediante CTE, para que el KPI y su
  variación salgan de una sola pasada.

El trabajo de medición (`EXPLAIN ANALYZE`, tiempos antes/después) se documenta en la Fase 9
contra el dataset sembrado.

---

## 7. Autenticación y sesiones

- **Tokens opacos**, no JWT: 32 bytes aleatorios; en la base solo se guarda su SHA-256. Un dump de
  la base no se puede reproducir como cookie.
- Cookie `vortex_session`, `httpOnly`, `secure` en producción, `sameSite=lax`, `path=/`, prioridad
  alta. El valor nunca se registra en logs.
- Expiración **absoluta** de 30 días. `last_used_at` se actualiza como máximo una vez por hora para
  no escribir en cada request. No hay expiración deslizante porque la cookie solo puede
  reescribirse en Server Actions o Route Handlers, no durante el render.
- Logout revoca (`revoked_at`) y borra la cookie. `getViewer()` se memoiza por request con
  `cache()` de React; el proxy solo comprueba la **presencia** de la cookie y la validación real
  ocurre en la capa de acceso a datos.
- El listado de sesiones permite revocar una sesión concreta o todas las demás.
- Reset de contraseña: token de un solo uso, con hash, expiración de 60 minutos, invalidación de
  los enlaces anteriores y revocación de **todas** las sesiones tras el cambio.
- Contraseñas con **scrypt** (`N=16384, r=8, p=1`, clave de 64 bytes, `maxmem` acotado y
  comparación con `timingSafeEqual`). El formato `scrypt$1$N$r$p$salt$key` lleva la versión y los
  costes, así que subir el coste o migrar a Argon2id puede hacerse rehasheando en el siguiente
  login sin invalidar contraseñas. No se usa `argon2` nativo para evitar binarios por plataforma.
- Enumeración de usuarios: un email inexistente verifica un hash ficticio, de modo que el tiempo
  de respuesta y el mensaje son idénticos a los de una contraseña incorrecta.
- Registro abierto: en una sola transacción se crea el usuario, la organización y la membresía
  `OWNER`, con dos entradas de auditoría (`organization.created`, `member.joined`). El slug se
  deriva del nombre y se saltan palabras reservadas (`app`, `login`, `api`, …).

Rate limiting: contadores de ventana fija en `rate_limit_counters`, porque en Vercel las
instancias no comparten memoria. Valores actuales: login 5/15 min por cuenta y 20/15 min por IP;
registro 5/hora por IP; solicitud de reset 3/hora por cuenta y 10/hora por IP.

Sin proveedor de email, el enlace de reset se imprime en el log en desarrollo y, en modo demo,
se devuelve a la UI **solo para cuentas `is_demo`**. La respuesta a "he olvidado mi contraseña"
es siempre la misma exista o no la cuenta.

---

## 8. Flujo de una petición de analítica

1. La página server-side resuelve sesión y membresía (guard).
2. Valida los filtros de la URL (`from`, `to`, `granularity`, `categoryId`) con Zod.
3. Llama a `analytics.revenue(orgId, range)`, que ejecuta SQL parametrizado.
4. PostgreSQL usa los índices compuestos de tenant.
5. El resultado se serializa al cliente; Recharts solo dibuja.
6. La exportación CSV/PDF reutiliza **la misma** función de datos, de modo que el archivo y el
   gráfico no pueden discrepar.

Con Cache Components activo, la lectura de sesión ocurre en request time detrás de un
`<Suspense>`; los datos derivados del tenant pueden cachearse con tags por organización y
revalidarse tras una mutación.

---

## 9. Decisiones y alternativas descartadas

| Decisión | Alternativa descartada | Por qué |
| --- | --- | --- |
| Sesiones opacas en Postgres | Auth.js / JWT | Revocación inmediata, control total del modelo y del flujo, sin dependencia externa |
| Prisma + SQL crudo para analítica | Solo ORM / solo SQL | Tipado y migraciones con ORM; agregaciones complejas donde el SQL es más claro |
| `Drizzle` | — | Prisma 7 con adaptadores y migraciones declarativas encaja mejor con el modelo relacional |
| URL con `orgSlug` | `orgId` en cada request | El tenant es visible, cacheable y no manipulable; el servidor resuelve la membresía |
| RLS con `FORCE` | Solo filtros de aplicación | Defensa en profundidad: un `WHERE` olvidado no se convierte en fuga |
| Centavos enteros | `Decimal` / `Float` | Sin ambigüedad de redondeo y comparaciones exactas |
| Contadores en Postgres | Redis / memoria | Funciona en serverless sin infraestructura extra |
| `scrypt` nativo | Argon2id (`@node-rs/argon2`) | Cero dependencias nativas; formato versionado permite migrar rehasheando |
| Expiración absoluta de sesión | Expiración deslizante | La cookie solo se reescribe en acciones/handlers; mantener el modelo explícito
| PDF con `@react-pdf/renderer` | Puppeteer / HTML print | Runtime Node sin binarios de navegador, apto para Vercel |
| Sin microfrontends | Varias apps | Un solo dominio, un solo deploy, un solo modelo de sesión |

---

## 10. Estado por fase

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Scaffold, esquema, migración, sistema de diseño, landing | ✅ |
| 2 | Sesiones, registro, login, reset, rutas protegidas | ✅ |
| 3 | Organizaciones, invitaciones, selector, guards RBAC | ⏳ |
| 4 | KPIs y gráficos desde SQL real | ⏳ |
| 5 | Tablas de pedidos, clientes y productos | ⏳ |
| 6 | Reportes CSV y PDF | ⏳ |
| 7 | Audit log con diffs | ⏳ |
| 8 | Seed de Acme y Nordwind + modo demo de solo lectura | ⏳ |
| 9 | RLS con `FORCE`, rendimiento, hardening | ⏳ |
| 10 | Tests, CI/CD, despliegue en Vercel + Neon | ⏳ |

---

## 11. Entornos

| Entorno | Base de datos | Notas |
| --- | --- | --- |
| Local | Docker `postgres:16-alpine` en el puerto **5434** | Adaptador `pg`; volumen persistente |
| CI | Servicio Postgres efímero | Migraciones con `prisma migrate deploy` |
| Producción | Neon (pooled + direct) | Adaptador `@prisma/adapter-neon`; PDF en runtime Node |

`src/server/db/client.ts` elige el adaptador según el host de `DATABASE_URL`
(`*.neon.tech` → Neon) o la variable `DATABASE_DRIVER=neon`.
