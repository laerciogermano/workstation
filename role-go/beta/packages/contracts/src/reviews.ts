import { z } from 'zod';

export const REVIEW_WINDOW_DAYS = 7;
export const ReviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});
export type ReviewBody = z.infer<typeof ReviewBody>;
export const ReviewDto = z.object({
  id: z.string().uuid(),
  rating: z.number(),
  comment: z.string().nullable(),
  author: z.object({ name: z.string(), photoUrl: z.string().nullable() }),
  createdAt: z.string(),
  mine: z.boolean(),
});
export type ReviewDto = z.infer<typeof ReviewDto>;
