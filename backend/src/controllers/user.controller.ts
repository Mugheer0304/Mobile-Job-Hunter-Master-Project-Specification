import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/sendResponse';
import * as userService from '../services/user.service';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getProfileByUserId(req.params.id);
  return sendResponse(res, 200, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.user!.id, req.body);
  return sendResponse(res, 200, user);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateMe(req.user!.id, req.body);
  return sendResponse(res, 200, user);
});

export const addExperience = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.addExperience(req.user!.id, req.body);
  return sendResponse(res, 201, user);
});

export const removeExperience = asyncHandler(async (req: Request, res: Response) => {
  await userService.removeExperience(req.user!.id, req.params.id);
  return sendResponse(res, 200, null, 'Experience removed');
});

export const addEducation = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.addEducation(req.user!.id, req.body);
  return sendResponse(res, 201, user);
});

export const removeEducation = asyncHandler(async (req: Request, res: Response) => {
  await userService.removeEducation(req.user!.id, req.params.id);
  return sendResponse(res, 200, null, 'Education removed');
});

export const addSkill = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.addSkill(req.user!.id, req.body.name);
  return sendResponse(res, 201, user);
});

export const removeSkill = asyncHandler(async (req: Request, res: Response) => {
  await userService.removeSkill(req.user!.id, req.params.name);
  return sendResponse(res, 200, null, 'Skill removed');
});
