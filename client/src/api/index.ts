const API_BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || `Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  varieties: {
    list: () => request<Variety[]>("/varieties"),
    get: (id: number) => request<Variety>(`/varieties/${id}`),
    create: (data: VarietyInput) => request<Variety>("/varieties", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: VarietyInput) => request<Variety>(`/varieties/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ message: string }>(`/varieties/${id}`, { method: "DELETE" }),
  },
  entries: {
    list: (params?: { varietyId?: number; from?: string; to?: string }) => {
      const qs = new URLSearchParams();
      if (params?.varietyId) qs.set("varietyId", String(params.varietyId));
      if (params?.from) qs.set("from", params.from);
      if (params?.to) qs.set("to", params.to);
      return request<EntryWithVariety[]>(`/entries?${qs.toString()}`);
    },
    create: (data: EntryInput) => request<GreenCoffeeEntry>(`/entries`, { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ message: string }>(`/entries/${id}`, { method: "DELETE" }),
  },
  batches: {
    list: (params?: { varietyId?: number; from?: string; to?: string }) => {
      const qs = new URLSearchParams();
      if (params?.varietyId) qs.set("varietyId", String(params.varietyId));
      if (params?.from) qs.set("from", params.from);
      if (params?.to) qs.set("to", params.to);
      return request<BatchWithVariety[]>(`/batches?${qs.toString()}`);
    },
    create: (data: BatchInput) => request<RoastingBatch>(`/batches`, { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ message: string }>(`/batches/${id}`, { method: "DELETE" }),
  },
  inventory: {
    list: () => request<InventoryItem[]>("/inventory"),
  },
  dashboard: {
    get: () => request<DashboardData>("/dashboard"),
  },
};

export interface Variety {
  id: number;
  name: string;
  origin: string | null;
  notes: string | null;
  createdAt: string;
}

export interface VarietyInput {
  name: string;
  origin?: string;
  notes?: string;
}

export interface GreenCoffeeEntry {
  id: number;
  varietyId: number;
  kilos: number;
  supplier: string | null;
  entryDate: string;
  notes: string | null;
  createdAt: string;
}

export interface EntryWithVariety extends GreenCoffeeEntry {
  varietyName: string | null;
}

export interface EntryInput {
  varietyId: number;
  kilos: number;
  supplier?: string;
  entryDate: string;
  notes?: string;
}

export interface RoastingBatch {
  id: number;
  varietyId: number;
  greenKilos: number;
  roastedKilos: number;
  batchDate: string;
  notes: string | null;
  createdAt: string;
}

export interface BatchWithVariety extends RoastingBatch {
  varietyName: string | null;
  mermaKg: number;
  mermaPct: number;
}

export interface BatchInput {
  varietyId: number;
  greenKilos: number;
  roastedKilos: number;
  batchDate: string;
  notes?: string;
}

export interface InventoryItem {
  varietyId: number;
  varietyName: string;
  origin: string | null;
  totalGreenIn: number;
  totalGreenUsed: number;
  availableGreen: number;
  totalRoasted: number;
}

export interface DashboardData {
  summary: {
    totalGreenIn: number;
    totalGreenUsed: number;
    totalRoasted: number;
    mermaKg: number;
    mermaPct: number;
  };
  varietyStats: VarietyStat[];
  recentBatches: BatchWithVariety[];
  recentEntries: EntryWithVariety[];
}

export interface VarietyStat {
  varietyId: number;
  varietyName: string;
  totalGreenIn: number;
  totalGreenUsed: number;
  totalRoasted: number;
  mermaKg: number;
  mermaPct: number;
}