import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/sendResponse';
import * as authService from '../services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return sendResponse(res, 201, result, 'Account created');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  return sendResponse(res, 200, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refresh(req.body.refreshToken);
  return sendResponse(res, 200, result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  return sendResponse(res, 200, null, 'Logged out');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  return sendResponse(res, 200, user);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  return sendResponse(res, 200, null, 'Password changed');
});
