import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess } from '@/core/utils/sendResponse';
import { getProfileOverview } from './profile.service';

export async function getMyProfile(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  const profile = await getProfileOverview(req.auth.id);
  return sendSuccess(res, profile, 'Profile fetched successfully');
}
