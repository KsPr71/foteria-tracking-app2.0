const STAGE_TITLES: Record<number, string> = {
  0: "Sesión realizada",
  1: "Preparación",
  2: "Edición",
  3: "Impresión",
  4: "Lista para entrega parcial",
  5: "Lista para entrega total",
  6: "Entregado",
};

export interface RemoteOrder {
  cliente: string;
  orden: string;
  fecha: string;
  estado: number;
  productos_entrega_parcial: string | null;
}

export interface OrderDataResponse {
  metadata: unknown;
  data: RemoteOrder[];
}

export function stageTitle(status: number): string {
  return STAGE_TITLES[status] ?? `Estado ${status}`;
}

export async function fetchOrders(url: string): Promise<RemoteOrder[]> {
  const cacheBuster = `?t=${Date.now()}&_=${Math.random()}`;
  const res = await fetch(`${url}${cacheBuster}`, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
  if (!res.ok) throw new Error(`Orders fetch failed: ${res.status} ${res.statusText}`);
  const json = (await res.json()) as OrderDataResponse;
  return json.data ?? [];
}
