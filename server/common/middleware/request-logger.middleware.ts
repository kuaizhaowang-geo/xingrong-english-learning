import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Request');

  private static readonly SKIP_PATHS: string[] = ['/health', '/metrics', '/static'];

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const path = originalUrl.split('?')[0];

    if (RequestLoggerMiddleware.SKIP_PATHS.some((p: string): boolean => path.startsWith(p))) {
      next();
      return;
    }

    const startTime: number = Date.now();

    res.on('finish', (): void => {
      const statusCode: number = res.statusCode;
      const durationMs: number = Date.now() - startTime;
      const userId: string | undefined = (req as Request & { userContext?: { userId?: string } }).userContext?.userId;

      this.logger.log(
        `[${method}] ${path} ${statusCode} ${durationMs}ms ${userId || 'anon'}`,
      );
    });

    next();
  }
}
