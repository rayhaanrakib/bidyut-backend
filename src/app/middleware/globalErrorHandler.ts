import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@/generated/prisma/client';
import { AppError } from '@utils/AppError';
import config from '@app/config';

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err instanceof AppError ? err.statusCode : 500;
  let message = err.message || 'Something went wrong';

  // map the Prisma error FAMILIES to friendly HTTP responses (class-reference taxonomy)
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'A field has the wrong type or is missing — check the request body';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409; // unique constraint
      message = 'A record with this value already exists';
    }
    if (err.code === 'P2003') {
      statusCode = 400; // foreign key constraint
      message = 'This action needs another record that does not exist (or is still referenced)';
    }
    if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503; // database unreachable / bad credentials
    message = "Can't reach the database — check DATABASE_URL and the provider's status page";
  }

  if (err?.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'Uploaded file is too large (max 2 MB)';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.server.isProduction ? {} : { stack: err.stack }),
  });
};

export default globalErrorHandler;