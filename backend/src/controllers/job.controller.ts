import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/sendResponse';
import * as jobService from '../services/job.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobService.listJobs(req.query as never);
  return sendResponse(res, 200, result);
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.getJobById(req.params.id);
  return sendResponse(res, 200, job);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.createJob({ ...req.body, postedById: req.user!.id });
  return sendResponse(res, 201, job, 'Job created');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.updateJob(req.params.id, req.body);
  return sendResponse(res, 200, job);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await jobService.deleteJob(req.params.id);
  return sendResponse(res, 200, null, 'Job deleted');
});
