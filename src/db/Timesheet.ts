import { z } from "zod";

/**
 * Represents the database schema for a note. This can be one of the following types:
 * -- Comment: a general comment made for an entry or whole timesheet.
 * -- Report: a specific report to reflect an incident that happens and requires admin attention, e.g. no-show or late attendance
 */
export const NoteSchema = z.object({
  Type: z.string(),
  AuthorUUID: z.string(),
  DateTime: z.number(),
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
 * Represents the database schema for the status of a timesheet. This could be one of the following types:
 * -- NotSubmitted
 * -- SupervisorReview (associate submitted, waiting for supervisor to submit)
 * -- AdminReview (assosciate and supervisor have both submitted, waiting for admin to submit)
 * -- Approved (Breaktime admin has reviewed and approved the associate and supervisor submissions)
 * -- NotApproved (Timesheet could not be process for some reason, further manual action is required)
 * 
 * SubmittedDate reflects the time of last submission, whether from associate, supervisor, or admin.
 */
export const StatusSchema = z.object({
  StatusType: z.string(),
  SubmittedDate: z.number(),
})

/**
 * Represents the database schema for a single shift or entry in the weekly timesheet. 
 */
export const TimesheetEntrySchema = z.object({
  AssociateTimes: TimeEntrySchema.optional(),
  SupervisorTimes: TimeEntrySchema.optional(),
  AdminTimes: TimeEntrySchema.optional(),
  Note: NoteSchema.optional(),
})

/**
 * Represents the database schema for a weekly timesheet
 */
export const TimeSheetSchema = z.object({
  TimesheetID: z.number(), 
  UserID: z.string(), 
  StartDate: z.number(),
  Status: StatusSchema,
  CompanyID: z.string(), 
  HoursData: z.array(TimesheetEntrySchema), 
  ScheduleData: z.array(ScheduleEntrySchema).optional(),
  WeekNotes: z.array(NoteSchema).optional(),
})

export type TimeSheetSchema = z.infer<typeof TimeSheetSchema>
