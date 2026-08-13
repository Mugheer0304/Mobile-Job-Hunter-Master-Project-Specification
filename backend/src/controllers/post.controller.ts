import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/sendResponse';
import * as postService from '../services/post.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await postService.listPosts(req.query as never);
  return sendResponse(res, 200, result);
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const post = await postService.getPost(req.params.id);
  return sendResponse(res, 200, post);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const post = await postService.createPost(req.user!.id, req.body);
  return sendResponse(res, 201, post, 'Post created');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const post = await postService.updatePost(req.params.id, req.user!.id, req.body);
  return sendResponse(res, 200, post);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await postService.deletePost(req.params.id, req.user!.id);
  return sendResponse(res, 200, null, 'Post deleted');
});

export const like = asyncHandler(async (req: Request, res: Response) => {
  const result = await postService.toggleLike(req.params.id, req.user!.id);
  return sendResponse(res, 200, result);
});

export const comment = asyncHandler(async (req: Request, res: Response) => {
  const c = await postService.addComment(req.params.id, req.user!.id, req.body.content);
  return sendResponse(res, 201, c, 'Comment added');
});
