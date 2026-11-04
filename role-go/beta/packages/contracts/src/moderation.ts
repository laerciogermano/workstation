import { z } from 'zod';

export const REPORT_REASONS = ['spam', 'fake', 'offensive', 'dangerous', 'other'] as const;
export const ReportBody = z.object({
  targetType: z.enum(['event', 'review', 'user', 'organizer']),
  targetId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  note: z.string().trim().max(500).optional(),
});
export type ReportBody = z.infer<typeof ReportBody>;

export const ResolveReportBody = z.object({
  action: z.enum(['remove', 'dismiss', 'hide_review', 'block_user']),
  note: z.string().trim().max(500).default(''),
});
export const BlockBody = z.object({ reason: z.string().trim().min(3).max(300) });

export const AdminReport = z.object({
  id: z.string().uuid(),
  targetType: z.string(),
  targetId: z.string().uuid(),
  targetLabel: z.string(),
  targetSlug: z.string().nullable(),
  reason: z.string(),
  note: z.string().nullable(),
  status: z.string(),
  reportsOnTarget: z.number(),
  reporterName: z.string(),
  createdAt: z.string(),
});
export type AdminReport = z.infer<typeof AdminReport>;

export const AdminOrganizerBody = z.object({
  displayName: z.string().trim().min(2).max(60),
  kind: z.enum(['person', 'bar', 'venue', 'producer']),
  contactEmail: z.string().email(),
  bio: z.string().max(300).optional(),
  instagram: z.string().max(31).optional(),
});
export const AdminStats = z.object({
  users: z.number(),
  onboarded: z.number(),
  organizers: z.number(),
  eventsPublished: z.number(),
  eventsUpcoming: z.number(),
  rsvpsGoing: z.number(),
  reviews: z.number(),
  openReports: z.number(),
});
export type AdminStats = z.infer<typeof AdminStats>;
