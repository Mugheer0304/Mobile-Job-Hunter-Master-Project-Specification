import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/sendResponse';
import * as notificationService from '../services/notification.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.listNotifications(req.user!.id, {
    ...(req.query as never),
    unreadOnly: req.query.unreadOnly === 'true',
  });
  return sendResponse(res, 200, result);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.markRead(req.user!.id, req.body.ids, req.body.all);
  return sendResponse(res, 200, result);
});
