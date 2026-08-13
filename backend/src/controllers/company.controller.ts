import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/sendResponse';
import * as companyService from '../services/company.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await companyService.listCompanies(req.query as never);
  return sendResponse(res, 200, result);
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.getCompany(req.params.id);
  return sendResponse(res, 200, company);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.createCompany(req.user!.id, req.body);
  return sendResponse(res, 201, company, 'Company created');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.updateCompany(req.params.id, req.body);
  return sendResponse(res, 200, company);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await companyService.deleteCompany(req.params.id);
  return sendResponse(res, 200, null, 'Company deleted');
});
