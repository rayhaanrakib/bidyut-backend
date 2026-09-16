import { prisma } from '@lib/prisma';
import { AppError } from '@utils/AppError';
import { getPagination } from '@utils/pagination';
import { ZonePayload, SubstationPayload, FeederPayload, AreaPayload } from '@modules/grid/grid.interface';

type GridModel = 'zone' | 'substation' | 'feeder' | 'area';

export const createGridService = <T>(model: GridModel, parentField?: string) => {
  const table = (prisma as any)[model];

  const create = async (data: T) => {
    return table.create({ data });
  };

  const list = async (query: Record<string, unknown>) => {
    const { page, limit, skip, sortBy, sortOrder, meta } = getPagination(query);
    const where: any = { isDeleted: false };
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    if (parentField && query[parentField]) where[parentField] = query[parentField];

    const [total, items] = await Promise.all([
      table.count({ where }),
      table.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
    ]);
    return { items, meta: meta(total) };
  };

  const getById = async (id: string) => {
    const item = await table.findFirst({ where: { id, isDeleted: false } });
    if (!item) throw new AppError(404, `${model} not found`);
    return item;
  };

  const update = async (id: string, data: Partial<T>) => {
    await getById(id);
    return table.update({ where: { id }, data });
  };

  const softDelete = async (id: string) => {
    const item = await getById(id);
    return table.update({ where: { id }, data: { isDeleted: true, name: `${item.name} (deleted ${Date.now()})` } });
  };

  return { create, list, getById, update, softDelete };
};

export const zoneService = createGridService<ZonePayload>('zone');
export const substationService = createGridService<SubstationPayload>('substation', 'zoneId');
export const feederService = createGridService<FeederPayload>('feeder', 'substationId');
export const areaService = createGridService<AreaPayload>('area', 'feederId');