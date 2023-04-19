import { z } from "zod";

/**
 * Represents the database schema for a comment
 */
export const CommentSchema = z.object({
  Type: z.string(),
  AuthorUUID: z.string(),
  Timestamp: z.number(),
  Content: z.string(),
  State: z.string(),
})

/**
 * Represents the database schema for a schedule shift entry, made by a supervisor or admin
 */
export const ScheduleEntrySchema = z.object({
  StartDate: z.number(),
  EndDate: z.number(),
})

/**
 * Represents the database schema for a clockin/clockout pair in epoch
 */
export const TimeEntrySchema = z.object({
  StartDate: z.number(),
  EndDate: z.number(),
})

/**
 * Represents the database schema for a single shift or entry in the weekly timesheet
 */
export const TimesheetEntrySchema = z.object({
  Type: z.string(), 
  AssociateTimes: TimeEntrySchema,
  SupervisorTimes: TimeEntrySchema.optional(),
  AdminTimes: TimeEntrySchema.optional(),
  Comment: CommentSchema.optional(),
})

/**
 * Represents the database schema for a weekly timesheet
 */
export const TimeSheetSchema = z.object({
  TimesheetID: z.number(), 
  UserID: z.string(), 
  StartDate: z.number(),
  Status: z.string(),
  CompanyID: z.string(), 
  TableData: z.array(TimeEntrySchema), 
  ScheduleData: z.array(ScheduleEntrySchema).optional(),
})

export type TimeSheetSchema = z.infer<typeof TimeSheetSchema>
