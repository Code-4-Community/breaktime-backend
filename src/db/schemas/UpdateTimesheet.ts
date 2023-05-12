import { z } from "zod";
import { RowSchema, CommentSchema, ScheduledRowSchema } from "../frontend/RowSchema";


// Currently supported timesheet operations 
export const enum TimesheetOperations {
    INSERT = "INSERT", 
    UPDATE = "UPDATE", 
    DELETE = "DELETE", 
    STATUS_CHANGE = "STATUS_CHANGE", 
    CREATE_TIMESHEET = "CREATE_TIMESHEET"
}



export const enum TimesheetListItems {
    TABLEDATA = "TABLEDATA", 
    SCHEDULEDATA = "SCHEDULEDATA", 
    WEEKNOTES = "WEEKNOTES"
}

const availableListTypes = z.enum([TimesheetListItems.TABLEDATA, TimesheetListItems.SCHEDULEDATA, TimesheetListItems.WEEKNOTES])

export const DeleteRequest = z.object({
    Type: availableListTypes, 
    Id: z.string() 
})
export type DeleteRequest = z.infer<typeof DeleteRequest> 

export const InsertRequest = z.object({
    Type: availableListTypes, 
    Item: z.union([RowSchema, CommentSchema, ScheduledRowSchema]), 
})
export type InsertRequest = z.infer<typeof InsertRequest> 
/*
    Schema for updating an item from the three possible list of items in the timesheet 
    Type: The field of the timesheet we are updating from the three supported 
    Id: the id of the entry we are updating - correlates to that row / entry in the list of items 
    Attribute: The specific attribute of the object we are updating 
    Data: The payload we are updating this attribute to be - can be a wide range of things currently 
*/
export const UpdateRequest = z.object({
    Type: availableListTypes, 
    Id: z.string(), 
    Attribute: z.string(), 
    Data: z.any() 
})
export type UpdateRequest = z.infer<typeof UpdateRequest>


// The main request body that is used to determine what we should be updating in a request 
export const TimesheetUpdateRequest = z.object({
    TimesheetID: z.number(), 
    Operation: z.enum([
        TimesheetOperations.INSERT,
        TimesheetOperations.UPDATE,
        TimesheetOperations.DELETE,
        TimesheetOperations.STATUS_CHANGE, 
        TimesheetOperations.CREATE_TIMESHEET
        ]), 
    Payload: z.union([DeleteRequest, UpdateRequest, InsertRequest])
})
export type TimesheetUpdateRequest = z.infer<typeof TimesheetUpdateRequest>
