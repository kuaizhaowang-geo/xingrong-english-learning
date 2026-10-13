import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start: number = Date.now();
    const res: Response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap((): void => {
        const durationMs: number = Date.now() - start;
        res.setHeader('X-Response-Time', `${durationMs}ms`);
      }),
    );
  }
}
