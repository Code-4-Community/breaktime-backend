import { z } from "zod";

export const TimeSheetSchema = z.object({
  TimesheetID: z.number(), 
  UserID: z.string(), 
  StartDate: z.number(),
  Status: z.string(),
  Company: z.string(), 
  TableData: z.string(), 
})

export type TimeSheetSchema = z.infer<typeof TimeSheetSchema>
