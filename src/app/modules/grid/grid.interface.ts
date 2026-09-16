export interface ZonePayload {
  name: string;
  code?: string;
}

export interface SubstationPayload {
  name: string;
  zoneId: string;
}

export interface FeederPayload {
  name: string;
  substationId: string;
  capacityMW?: number;
}

export interface AreaPayload {
  name: string;
  feederId: string;
}

export type CrudService<T> = {
  create: (data: T) => Promise<any>;
  list: (query: Record<string, unknown>) => Promise<{
    items: any;
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getById: (id: string) => Promise<any>;
  update: (id: string, data: Partial<T>) => Promise<any>;
  softDelete: (id: string) => Promise<any>;
};

export type IdParams = {
  id: string;
};
