import type { ListResult } from "@/lib/validation/table";

/** Shared fetcher for the table Route Handlers. */
export async function fetchTableData<Row>(url: string): Promise<ListResult<Row>> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with ${response.status}.`);
  }

  return (await response.json()) as ListResult<Row>;
}
