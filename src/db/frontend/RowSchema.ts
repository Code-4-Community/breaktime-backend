//////////////////////////////////////////////////////////////////////////
// DELETE THIS WHEN MERGED WITH MONOREPO TO DIRECTLY PULL FROM FRONTEND //
//////////////////////////////////////////////////////////////////////////

import { z } from "zod";
import {CellType, CommentType, Review_Stages, CellStatus} from './CellTypes'; 


const optionalNumber = z.union([z.undefined(), z.number()]) 
const optionalString = z.union([z.undefined(), z.string()]); 



export const TimeRowEntry = z.union([z.undefined(), z.object({
    Start: optionalNumber, End: optionalNumber, AuthorID: optionalString
})]); 
export type TimeRowEntry = z.infer<typeof TimeRowEntry>

export const CommentSchema = z.object({
    UUID: z.string(), 
    AuthorID:z.string(), 
    Type: z.enum([CommentType.Comment, CommentType.Report]), 
    Timestamp: z.number(), 
    Content: z.string(), 
    State: z.enum([CellStatus.Active, CellStatus.Deleted]), 
}); 

export type CommentSchema = z.infer<typeof CommentSchema> 

export const RowType = z.enum([CellType.Regular, CellType.PTO]); 
export type RowType = z.infer<typeof RowType> 

export const RowSchema = z.object({
    UUID: z.string(), 
    Type: RowType, 
    Date: z.number(), 
    Associate: TimeRowEntry, 
    Supervisor: TimeRowEntry, 
    Admin: TimeRowEntry, 
    Comment: z.union([z.undefined(), z.array(CommentSchema)])
}); 
export type RowSchema = z.infer<typeof RowSchema>


export const ScheduledRowSchema = z.object({
    UUID: z.string(), 
    Date: z.number(), 
    Entry: TimeRowEntry
}); 

export type ScheduledRowSchema  = z.infer<typeof ScheduledRowSchema>
