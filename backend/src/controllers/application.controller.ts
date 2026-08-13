import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/sendResponse';
import * as applicationService from '../services/application.service';

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const application = await applicationService.apply(req.user!.id, req.body);
  return sendResponse(res, 201, application, 'Application submitted');
});

export const mine = asyncHandler(async (req: Request, res: Response) => {
  const result = await applicationService.listMyApplications(req.user!.id, req.query as never);
  return sendResponse(res, 200, result);
});

export const listForJob = asyncHandler(async (req: Request, res: Response) => {
  const result = await applicationService.listJobApplications(
    req.params.jobId,
    req.user!.id,
    req.query as never,
  );
  return sendResponse(res, 200, result);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const application = await applicationService.updateApplicationStatus(
    req.params.id,
    req.user!.id,
    req.body.status,
  );
  return sendResponse(res, 200, application);
});
