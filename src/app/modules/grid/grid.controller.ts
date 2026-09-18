import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { tryCatchAsync } from "../../utils/tryCatchAsync";
import type { CrudService } from "./grid.interface";
import * as gridService from "./grid.service";

const makeCrud = <T>(label: string, service: CrudService<T>) => {
  return {
    create: tryCatchAsync(async (req: Request, res: Response) => {
      const item = await service.create(req.body);
      sendResponse(res, 201, `${label} created`, item);
    }),

    list: tryCatchAsync(async (req: Request, res: Response) => {
      const { items, meta } = await service.list(req.query);
      sendResponse(res, 200, `${label}s retrieved`, items, meta);
    }),

    getById: tryCatchAsync(async (req: Request, res: Response) => {
      const item = await service.getById(req.params.id as string);
      sendResponse(res, 200, `${label} retrieved`, item);
    }),

    update: tryCatchAsync(async (req: Request, res: Response) => {
      const item = await service.update(req.params.id as string, req.body);
      sendResponse(res, 200, `${label} updated`, item);
    }),

    softDelete: tryCatchAsync(async (req: Request, res: Response) => {
      await service.softDelete(req.params.id as string);
      sendResponse(res, 200, `${label} deleted (soft)`);
    }),
  };
};

export const zoneController = makeCrud("Zone", gridService.zoneService);
export const substationController = makeCrud("Substation", gridService.substationService);
export const feederController = makeCrud("Feeder", gridService.feederService);
export const areaController = makeCrud("Area", gridService.areaService);
