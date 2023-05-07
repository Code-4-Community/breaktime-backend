import { z } from "zod";

/**
 * Represents the database schema for a note. This can be one of the following types:
 * -- Comment: a general comment made for an entry or whole timesheet.
 * -- Report: a specific report to reflect an incident that happens and requires admin attention, e.g. no-show or late attendance
 */
export const NoteSchema = z.object({
  Type: z.enum(["Comment", "Report"]),
  AuthorUUID: z.string().uuid(),
  DateTime: z.number(),
  Content: z.string(),
  State: z.enum(["Active", "Deleted"]),
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
 * -- HoursSubmitted (Associate has submitted their hours worked)
 * -- HoursReviewed (Supervisor has reviewed and approved the associate-submitted hours)
 * -- ScheduleSubmitted (Supervisor has submitted the scheduled hours)
 * -- Finalized (Admin has approved the submitted hours and schedule, and resolved any issue necessary)
 * 
 * SubmittedDate reflects the time of last submission, whether from associate, supervisor, or admin.
 */
export const StatusSchema = z.object({
  StatusType: z.enum(["HoursSubmitted", "HoursReviewed", "ScheduleSubmitted", "Finalized"]),
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
  UserID: z.string().uuid(), 
  StartDate: z.number(),
  StatusList: z.array(StatusSchema),
  CompanyID: z.string(), 
  HoursData: z.array(TimesheetEntrySchema).default([]), 
  ScheduleData: z.array(ScheduleEntrySchema).default([]),
  WeekNotes: z.array(NoteSchema).default([]),
})

export type TimeSheetSchema = z.infer<typeof TimeSheetSchema>
