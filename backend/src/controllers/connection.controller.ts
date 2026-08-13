import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/sendResponse';
import * as connectionService from '../services/connection.service';

export const send = asyncHandler(async (req: Request, res: Response) => {
  const connection = await connectionService.sendRequest(req.user!.id, req.body.addresseeId);
  return sendResponse(res, 201, connection, 'Request sent');
});

export const respond = asyncHandler(async (req: Request, res: Response) => {
  const connection = await connectionService.respond(req.user!.id, req.params.id, req.body.status);
  return sendResponse(res, 200, connection);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await connectionService.listConnections(req.user!.id, req.query as never);
  return sendResponse(res, 200, result);
});

export const pending = asyncHandler(async (req: Request, res: Response) => {
  const connections = await connectionService.listPending(req.user!.id);
  return sendResponse(res, 200, connections);
});
