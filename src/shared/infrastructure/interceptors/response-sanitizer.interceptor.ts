import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * @class ResponseSanitizerInterceptor
 * @implements NestInterceptor
 * @description Intercepts successful responses globally. Currently logs the response data type.
 * It passes the data through without modification.
 */
@Injectable()
export class ResponseSanitizerInterceptor<T> implements NestInterceptor<T, T> {
  private readonly logger = new Logger(ResponseSanitizerInterceptor.name);

  /**
   * Intercepts the request pipeline and processes the response stream.
   * @param {ExecutionContext} context - The execution context.
   * @param {CallHandler} next - Provides access to the response stream.
   * @returns {Observable<T>} An observable of the original response data.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    const contextType = context.getType();
    this.logger.verbose(`Intercepting response for context type: ${contextType}`);

    return next
      .handle()
      .pipe(
        map(data => {
          this.logger.verbose(`Passing through response data of type: ${typeof data}`);
          return data;
        }),
      );
  }
}