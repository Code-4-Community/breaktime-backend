import { z } from "zod";
import { RowSchema, CommentSchema, ScheduledRowSchema } from "../frontend/RowSchema";
import * as dbTypes from '../schemas/Timesheet'

/*
    The supported timesheet operations currently supported. 
        Most operations relate to items that are inside the timesheet, whether it is the rows of the timesheet, the comments someone left 
        on it for example. 

    INSERT - Inserting an item into the timesheet 
    UPDATE - Updating a specific item in the timesheet 
    DELETE - Deleting a speciic item in the timesheet 

    STATUS_CHANGE - When the timesheet has been submitted / should be advanced to the next stage 
    CREATE-TIMESHEET - Operation for creating a timesheet, if it would be useful to have in the future. 
*/
export const enum TimesheetOperations {
    INSERT = "INSERT", 
    UPDATE = "UPDATE", 
    DELETE = "DELETE", 
    STATUS_CHANGE = "STATUS_CHANGE", 
    CREATE_TIMESHEET = "CREATE_TIMESHEET"
} 


/*
    The available types of items that are currently supported in the timesheet that list operations can be performed on. 
        TABLEDATA - the rows of the timesheet- basically their worked schedule  
        SCHEDULEDATA - the expected schedule they should have worked 
        WEEKNOTES - the comments left by an employer for that week 
*/
export const enum TimesheetListItems {
    TABLEDATA = "TABLEDATA", 
    SCHEDULEDATA = "SCHEDULEDATA", // TODO : delete this
    WEEKNOTES = "WEEKNOTES"
}

const availableListTypes = z.enum([TimesheetListItems.TABLEDATA, TimesheetListItems.SCHEDULEDATA, TimesheetListItems.WEEKNOTES])

/* 
    The schema for a delete request 
        @Type: The type of the item this delete request is processing - see available types in TimesheetListItems 
        @Id: The id of the item we are deleting - to know what to remove 
*/
export const DeleteRequest = z.object({
    Type: availableListTypes, 
    Id: z.string() 
})
export type DeleteRequest = z.infer<typeof DeleteRequest> 

/*
    The schema for an insert request for an item 
        @Type: The type of the item that we are inserting, to know what we should be adding this item to
        @Item: The item we are actually inserting, should be the actual item itself. 
*/
export const InsertRequest = z.object({
    Type: availableListTypes, 
    Item: z.union([RowSchema, CommentSchema, ScheduledRowSchema, dbTypes.TimesheetEntrySchema]), 
}) 
export type InsertRequest = z.infer<typeof InsertRequest> 
/*
    Schema for updating an item from the three possible list of items in the timesheet 
        @Type: The field of the timesheet we are updating from the three supported 
        @Id: the id of the entry we are updating - correlates to that row / entry in the list of items 
        @Attribute: The specific attribute of the object we are updating 
        @Data: The payload we are updating this attribute to be - can be a wide range of things currently 
*/
export const UpdateRequest = z.object({
    Type: availableListTypes, 
    Id: z.string(), 
    Attribute: z.string(), 
    Data: z.any() 
})
export type UpdateRequest = z.infer<typeof UpdateRequest>

/*
    Schema for changing the status of a timesheet 
        @TimesheetId: The id of the timesheet we are updating 
        @AssociateId: The id of the associate whose timesheet is being submitted
*/
export const StatusChangeRequest = z.object({
    TimesheetId: z.string(),
    AssociateId: z.string()
})

/* The main request body that is used to determine what we should be updating in a request 
    @TimesheetID: The id of the timesheet we are updating 
    @Operation: The type of operation we are performing on this timesheet 
    @Payload: The contents to be used in the operation for updating this. 
*/
export const TimesheetUpdateRequest = z.object({
    TimesheetID: z.number(), 
    Operation: z.enum([
        TimesheetOperations.INSERT,
        TimesheetOperations.UPDATE,
        TimesheetOperations.DELETE,
        TimesheetOperations.STATUS_CHANGE, 
        TimesheetOperations.CREATE_TIMESHEET
        ]),  
    Payload: z.any()
})
export type TimesheetUpdateRequest = z.infer<typeof TimesheetUpdateRequest>

