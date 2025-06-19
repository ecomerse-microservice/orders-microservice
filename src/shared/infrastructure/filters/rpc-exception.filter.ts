import { Catch, ArgumentsHost, Logger, HttpStatus } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * @interface StandardRpcError
 * @description Defines a standardized structure for errors returned over RPC.
 */
interface StandardRpcError {
  status: number;
  message: string;
  timestamp: string;
}

/**
 * @class AllExceptionsFilter
 * @extends BaseRpcExceptionFilter
 * @description A global exception filter for NestJS microservices communicating via RPC (like NATS).
 * It catches RpcException instances and formats them, and also catches standard Error instances,
 * converting them into a standardized RPC error format with an INTERNAL_SERVER_ERROR status.
 */
@Catch() // Catch all exceptions if no more specific filter catches them
export class AllExceptionsFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * Handles caught exceptions and transforms them into an observable error stream.
   * @param {any} exception - The caught exception object.
   * @param {ArgumentsHost} host - Provides access to the arguments of the original handler.
   * @returns {Observable<any>} An observable that throws the standardized error.
   */
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    this.logger.error(
      `Exception caught: ${exception.message || exception}`, exception.stack,
      host.getType()
    );

    if (exception instanceof RpcException) {
      const rpcError = exception.getError();
      if (typeof rpcError === 'object' && rpcError !== null) {
        status = (rpcError as any).status || status;
        message = (rpcError as any).message || message;
      } else {
        message = rpcError as string;
        status = HttpStatus.BAD_REQUEST; // Default for simple RpcException message
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: StandardRpcError = {
      status: status,
      message: message,
      timestamp: new Date().toISOString(),
    };

    return throwError(() => errorResponse);
  }
}