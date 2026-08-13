import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/sendResponse';
import * as adminService from '../services/admin.service';

export const users = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.listUsers(req.query as never);
  return sendResponse(res, 200, result);
});

export const setActive = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.setUserActive(req.params.id, req.body.isActive);
  return sendResponse(res, 200, user);
});

export const setRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.setUserRole(req.params.id, req.body.role);
  return sendResponse(res, 200, user);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteUser(req.params.id);
  return sendResponse(res, 200, null, 'User deleted');
});

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const result = await adminService.stats();
  return sendResponse(res, 200, result);
});
