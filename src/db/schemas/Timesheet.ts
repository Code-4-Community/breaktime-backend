import { z } from "zod";
/**
 * Represents the database schema for a note. This can be one of the following types:
 * -- Comment: a general comment made for an entry or whole timesheet.
 * -- Report: a specific report to reflect an incident that happens and requires admin attention, e.g. no-show or late attendance
 */
export const NoteSchema = z.object({
  Type: z.enum(["Comment", "Report"]),
  EntryID: z.string().uuid(), 
  AuthorUUID: z.string().uuid(),
  DateTime: z.number(),
  Content: z.string(),
  State: z.enum(["Active", "Deleted"]),
})

/**
 * Represents the database schema for a schedule shift entry, made by a supervisor or admin
 */
export const ScheduleEntrySchema = z.object({
  EntryID: z.string().uuid(), 
  Date: z.number(), 
  StartDateTime: z.number(),
  EndDateTime: z.number(),
  AuthorUUID: z.string().uuid()
})

/**
 * Represents the database schema for a clockin/clockout pair in epoch
 */
export const TimeEntrySchema = z.object({
  StartDateTime: z.number(),
  EndDateTime: z.number(),
  AuthorUUID: z.string().uuid(),
})


export enum CellType {
  REGULAR = "Regular", 
  PTO = "PTO"
}

/**
 * Represents the database schema for a single shift or entry in the weekly timesheet. 
 */
export const TimesheetEntrySchema = z.object({
  Type: z.enum([CellType.REGULAR, CellType.PTO]),
  EntryID: z.string().uuid(), 
  Date: z.number(), 
  AssociateTimes: TimeEntrySchema.optional(),
  SupervisorTimes: TimeEntrySchema.optional(),
  AdminTimes: TimeEntrySchema.optional(),
  Note: z.array(NoteSchema).optional(),
})


// The status is either undefined, for not being at that stage yet, or 
// contains the date and author of approving this submission 
export const StatusEntryType = z.union(
  [z.object({
    Date: z.number(),  
    AuthorID: z.string()
  }), 
  z.undefined()]); 

// Status type contains the four stages of the pipeline we have defined 
export const StatusType = z.object({
  HoursSubmitted: StatusEntryType, 
  HoursReviewed: StatusEntryType,
  ScheduleSubmitted: StatusEntryType, 
  Finalized: StatusEntryType 
});

/**
 * Represents the database schema for a weekly timesheet
 */
export const TimeSheetSchema = z.object({
  TimesheetID: z.number(), 
  UserID: z.string().uuid(), 
  StartDate: z.number(),
  Status: StatusType,
  CompanyID: z.string(), 
  HoursData: z.array(TimesheetEntrySchema).default([]), 
  ScheduleData: z.array(ScheduleEntrySchema).default([]),
  WeekNotes: z.array(NoteSchema).default([]),
})

export type TimeEntrySchema = z.infer<typeof TimeEntrySchema> 
export type ScheduleEntrySchema = z.infer<typeof ScheduleEntrySchema> 
export type NoteSchema = z.infer<typeof NoteSchema>
export type TimesheetEntrySchema = z.infer<typeof TimesheetEntrySchema>
export type TimeSheetSchema = z.infer<typeof TimeSheetSchema>
