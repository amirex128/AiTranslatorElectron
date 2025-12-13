import { IpcMainInvokeEvent } from 'electron';
import { IPCResponse, createSuccessResponse, createErrorResponse } from '../../types/errors';

/**
 * Wraps an async handler function with consistent error handling
 * Handles IPC handlers that receive (event, ...args)
 */
export function handleIPC<T>(
  handler: () => Promise<T>
): () => Promise<IPCResponse<T>>;

export function handleIPC<T, P>(
  handler: (event: IpcMainInvokeEvent, params: P) => Promise<T>
): (event: IpcMainInvokeEvent, params: P) => Promise<IPCResponse<T>>;

export function handleIPC<T>(
  handler: (event: IpcMainInvokeEvent) => Promise<T>
): (event: IpcMainInvokeEvent) => Promise<IPCResponse<T>>;

export function handleIPC<T, P = void>(
  handler: ((event: IpcMainInvokeEvent, params: P) => Promise<T>) | (() => Promise<T>) | ((event: IpcMainInvokeEvent) => Promise<T>)
): ((event: IpcMainInvokeEvent, params: P) => Promise<IPCResponse<T>>) | (() => Promise<IPCResponse<T>>) | ((event: IpcMainInvokeEvent) => Promise<IPCResponse<T>>) {
  return (async (event?: IpcMainInvokeEvent, params?: P): Promise<IPCResponse<T>> => {
    try {
      let result: T;
      if (handler.length === 0) {
        result = await (handler as () => Promise<T>)();
      } else if (handler.length === 1) {
        result = await (handler as (event: IpcMainInvokeEvent) => Promise<T>)(event!);
      } else {
        result = await (handler as (event: IpcMainInvokeEvent, params: P) => Promise<T>)(event!, params!);
      }
      return createSuccessResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('IPC handler error:', errorMessage);
      return createErrorResponse(errorMessage);
    }
  }) as any;
}

/**
 * Wraps a sync handler function with consistent error handling
 */
export function handleIPCSync<T>(
  handler: () => T
): () => IPCResponse<T>;

export function handleIPCSync<T, P>(
  handler: (event: IpcMainInvokeEvent, params: P) => T
): (event: IpcMainInvokeEvent, params: P) => IPCResponse<T>;

export function handleIPCSync<T>(
  handler: (event: IpcMainInvokeEvent) => T
): (event: IpcMainInvokeEvent) => IPCResponse<T>;

export function handleIPCSync<T, P = void>(
  handler: ((event: IpcMainInvokeEvent, params: P) => T) | (() => T) | ((event: IpcMainInvokeEvent) => T)
): ((event: IpcMainInvokeEvent, params: P) => IPCResponse<T>) | (() => IPCResponse<T>) | ((event: IpcMainInvokeEvent) => IPCResponse<T>) {
  return ((event?: IpcMainInvokeEvent, params?: P): IPCResponse<T> => {
    try {
      let result: T;
      if (handler.length === 0) {
        result = (handler as () => T)();
      } else if (handler.length === 1) {
        result = (handler as (event: IpcMainInvokeEvent) => T)(event!);
      } else {
        result = (handler as (event: IpcMainInvokeEvent, params: P) => T)(event!, params!);
      }
      return createSuccessResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('IPC handler error:', errorMessage);
      return createErrorResponse(errorMessage);
    }
  }) as any;
}

