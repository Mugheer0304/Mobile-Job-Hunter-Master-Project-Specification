import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/sendResponse';
import * as messageService from '../services/message.service';

export const conversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await messageService.listConversations(req.user!.id);
  return sendResponse(res, 200, conversations);
});

export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await messageService.getOrCreateConversation(req.user!.id, req.body.userId);
  return sendResponse(res, 201, conversation);
});

export const send = asyncHandler(async (req: Request, res: Response) => {
  const message = await messageService.sendMessage(
    req.user!.id,
    req.body.conversationId,
    req.body.content,
  );
  return sendResponse(res, 201, message, 'Message sent');
});

export const messages = asyncHandler(async (req: Request, res: Response) => {
  const result = await messageService.listMessages(
    req.user!.id,
    req.params.conversationId,
    req.query as never,
  );
  return sendResponse(res, 200, result);
});
