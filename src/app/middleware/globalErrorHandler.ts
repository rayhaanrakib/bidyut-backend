import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@/generated/prisma/client';
import { AppError } from '@utils/AppError';
import config from '@app/config';

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Something went wrong';

  // AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Prisma errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid request data. Please check your input.';
  }

  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this value already exists';
        break;

      case 'P2003':
        statusCode = 400;
        message = 'This action references a record that does not exist';
        break;

      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;

      default:
        statusCode = 500;
        message = 'A database error occurred';
    }
  }

  // Prisma initialization error
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  }

  // File upload error
  else if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    err.code === 'LIMIT_FILE_SIZE'
  ) {
    statusCode = 400;
    message = 'Uploaded file is too large (max 2 MB)';
  }

  // Response
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.server.isProduction
      ? {}
      : {
          error: {
            name: err instanceof Error ? err.name : 'UnknownError',
            stack: err instanceof Error ? err.stack : undefined,
          },
        }),
  });
};

export default globalErrorHandler;
