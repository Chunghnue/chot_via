import { z } from 'zod';
import { CHALLENGE_SCOPES, MISSION_ACTIONS, MISSION_PERIODS } from '../enums';
import { IdSchema, IsoDateSchema } from '../common';

export const MissionSchema = z.object({
  id: IdSchema, code: z.string(), name: z.string(), description: z.string(),
  period: z.enum(MISSION_PERIODS), action: z.enum(MISSION_ACTIONS), target: z.number().int().positive(),
  /** null = khách chưa đăng nhập (chỉ xem danh sách). */
  progress: z.number().int().nullable(),
  completed: z.boolean(),
});
export type MissionDto = z.infer<typeof MissionSchema>;

export const ChallengeSchema = z.object({
  id: IdSchema, name: z.string(), description: z.string(), action: z.enum(MISSION_ACTIONS), target: z.number().int().positive(),
  scope: z.enum(CHALLENGE_SCOPES), progress: z.number().int().nullable(), endsAt: IsoDateSchema,
});
export type ChallengeDto = z.infer<typeof ChallengeSchema>;

export const EventSchema = z.object({ id: IdSchema, title: z.string(), description: z.string(), coverUrl: z.string().nullable(), startsAt: IsoDateSchema, endsAt: IsoDateSchema });
export type EventDto = z.infer<typeof EventSchema>;
