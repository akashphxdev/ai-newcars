// src/modules/public/home/story/story.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { homeStoryListQuerySchema } from './story.validation';
import * as storyService from './story.service';

// GET /api/public/v1/home/stories
export async function getHomeStories(req: Request, res: Response) {
  const query = homeStoryListQuerySchema.parse(req.query);
  const groups = await storyService.listHomeStoryGroups(query);
  return sendSuccess(res, groups, 'Stories fetched successfully');
}
