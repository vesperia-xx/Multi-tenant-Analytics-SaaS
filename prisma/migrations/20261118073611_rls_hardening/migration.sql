-- CreateIndex
CREATE INDEX "audit_logs_organization_id_action_created_at_idx" ON "audit_logs"("organization_id", "action", "created_at" DESC);

-- ---------------------------------------------------------------------------
-- Row-Level Security: a second fence under the application-layer tenant guard.
--
-- The app sets `app.current_organization_id` inside the transaction that runs
-- each tenant query (see src/server/db/tenant.ts). The setting is local to the
-- transaction, so a pooled connection cannot leak a tenant into the next one.
--
-- Tables that resolve the tenant before it is known (users, organizations,
-- memberships, invitations, sessions, reset tokens) stay outside RLS by
-- design; they are guarded by the data-access layer and always query by user
-- or token, never by a client-supplied organization id.
-- ---------------------------------------------------------------------------

ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_tenant_isolation" ON "categories";
CREATE POLICY "categories_tenant_isolation" ON "categories"
  USING ("organization_id" = current_setting('app.current_organization_id', true))
  WITH CHECK ("organization_id" = current_setting('app.current_organization_id', true));

ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_tenant_isolation" ON "products";
CREATE POLICY "products_tenant_isolation" ON "products"
  USING ("organization_id" = current_setting('app.current_organization_id', true))
  WITH CHECK ("organization_id" = current_setting('app.current_organization_id', true));

ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_tenant_isolation" ON "customers";
CREATE POLICY "customers_tenant_isolation" ON "customers"
  USING ("organization_id" = current_setting('app.current_organization_id', true))
  WITH CHECK ("organization_id" = current_setting('app.current_organization_id', true));

ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_tenant_isolation" ON "orders";
CREATE POLICY "orders_tenant_isolation" ON "orders"
  USING ("organization_id" = current_setting('app.current_organization_id', true))
  WITH CHECK ("organization_id" = current_setting('app.current_organization_id', true));

ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_tenant_isolation" ON "order_items";
CREATE POLICY "order_items_tenant_isolation" ON "order_items"
  USING ("organization_id" = current_setting('app.current_organization_id', true))
  WITH CHECK ("organization_id" = current_setting('app.current_organization_id', true));

ALTER TABLE "traffic_daily" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "traffic_daily" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "traffic_daily_tenant_isolation" ON "traffic_daily";
CREATE POLICY "traffic_daily_tenant_isolation" ON "traffic_daily"
  USING ("organization_id" = current_setting('app.current_organization_id', true))
  WITH CHECK ("organization_id" = current_setting('app.current_organization_id', true));

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON "audit_logs";
CREATE POLICY "audit_logs_tenant_isolation" ON "audit_logs"
  USING ("organization_id" = current_setting('app.current_organization_id', true))
  WITH CHECK ("organization_id" = current_setting('app.current_organization_id', true));

-- ---------------------------------------------------------------------------
-- The ledger is append-only at the database level too. The seed sets
-- `app.allow_audit_maintenance` inside its own transaction when it rebuilds
-- the demo fixtures; no application code path ever sets it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "audit_logs_append_only"() RETURNS trigger AS $$
BEGIN
  IF current_setting('app.allow_audit_maintenance', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "audit_logs_no_update_delete" ON "audit_logs";
CREATE TRIGGER "audit_logs_no_update_delete"
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW
  EXECUTE FUNCTION "audit_logs_append_only"();
