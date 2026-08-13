import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function sendResponse<T>(res: Response, statusCode: number, data: T, message?: string) {
  const body: ApiResponse<T> = { success: true, data, ...(message ? { message } : {}) };
  return res.status(statusCode).json(body);
}
