import { Request, Response } from 'express';
import { tryCatchAsync } from '@utils/tryCatchAsync';
import { sendResponse } from '@utils/sendResponse';
import { getGridStatus } from './public.service';

export const gridStatus = tryCatchAsync(
  async (req: Request, res: Response) => {
    const { areaId } = req.params;

    const { cache, data } = await getGridStatus(areaId as string);

    res.setHeader('X-Cache', cache);

    return sendResponse(res, 200, 'Grid status', data);
  },
);
