//////////////////////////////////////////////////////////////////////////
// DELETE THIS WHEN MERGED WITH MONOREPO TO DIRECTLY PULL FROM FRONTEND //
//////////////////////////////////////////////////////////////////////////

import { z } from "zod";
import { ScheduleEntrySchema } from "../Timesheet";
import {RowSchema, ScheduledRowSchema, CommentSchema} from './RowSchema'; 

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

export const FrontendTimeSheetSchema = z.object({
  TimesheetID: z.number(), 
  UserID: z.string(), 
  StartDate: z.number(),
  Status: StatusType, 
  CompanyID: z.string(), 
  TableData: z.array(RowSchema), 
  ScheduleTableData: z.union([z.undefined(), z.array(ScheduleEntrySchema)]),
  WeekNotes: z.union([z.undefined(), z.array(CommentSchema)]), 
}); 

export type FrontendTimeSheetSchema = z.infer<typeof FrontendTimeSheetSchema>
