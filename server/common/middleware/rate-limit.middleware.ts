import { Injectable, Logger, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  private readonly windowMs: number;
  private readonly max: number;
  private readonly store: Map<string, { count: number; resetAt: number }> = new Map();

  constructor() {
    this.windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000;
    this.max = Number(process.env.RATE_LIMIT_MAX) || 60;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      const ip: string = req.ip || req.socket.remoteAddress || 'unknown';
      const now: number = Date.now();
      const entry = this.store.get(ip);

      if (!entry || now > entry.resetAt) {
        this.store.set(ip, { count: 1, resetAt: now + this.windowMs });
        res.setHeader('X-RateLimit-Limit', String(this.max));
        res.setHeader('X-RateLimit-Remaining', String(this.max - 1));
        next();
        return;
      }

      entry.count += 1;
      const remaining: number = Math.max(0, this.max - entry.count);
      res.setHeader('X-RateLimit-Limit', String(this.max));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

      if (entry.count > this.max) {
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }

      next();
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.error(
        `rate-limit middleware error: ${err instanceof Error ? err.message : String(err)}`,
      );
      next();
    }
  }
}
