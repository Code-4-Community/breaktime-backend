import * as frontendRowTypes from '../frontend/RowSchema'
import * as dbTimesheetTypes from '../schemas/Timesheet'
import * as requestSchemas from '../schemas/UpdateTimesheet'
import {FrontendTimeSheetSchema} from '../frontend/TimesheetSchema'
import * as frontendTypes from '../frontend/CellTypes'

/*
    Code for converting from the frontend to our backend equivalents. Useful for actually processing this to be stored in our database / align with what our 
    backend expects to see in this data. 
*/


// Class to represent the mappings from a frontend key to a backend key alongside a conversion fn for the data
class KeyPairMappings  {
    originalKey:string; 
    conversionFn: Function; 
    finalKey: string; 

    constructor(originalKey:string, finalKey: string, conversionFn:Function) {
        this.originalKey = originalKey; 
        this.conversionFn = conversionFn; 
        this.finalKey = finalKey; 
    }
}

export class frontendEntryConversions {
    //NOTE: The key in the dictionary must match frontend key name as this is how we automatically convert keys  
    private static hoursDataMappings = {
        Type: new KeyPairMappings("Type", "Type", frontendEntryConversions.toDBType), 
        Associate: new KeyPairMappings("Associate", "AssociateTimes", frontendEntryConversions.toDBRowEntry),
        Supervisor: new KeyPairMappings("Supervisor", "SupervisorTimes", frontendEntryConversions.toDBRowEntry), 
        Admin: new KeyPairMappings("Admin", "AdminTimes", frontendEntryConversions.toDBRowEntry),
        Comment: new KeyPairMappings("Comment", "Note", frontendEntryConversions.toDBNotes)
    } 
  

    /*
        Delegate that converts the item we are inserting to its database equivalent so that it can actually exist on the table 
    */
    public static insertConversion(body: requestSchemas.InsertRequest) : requestSchemas.InsertRequest {
        
        switch (body.Type) {
            case requestSchemas.TimesheetListItems.TABLEDATA:
                return {
                    ...body, 
                    Item: this.toDBRow(frontendRowTypes.RowSchema.parse(body.Item))
                
                }
            case requestSchemas.TimesheetListItems.SCHEDULEDATA:
                throw new Error("Not yet implemented")

            case requestSchemas.TimesheetListItems.WEEKNOTES:
                throw new Error("Not yet implemented")

            default:
                throw new Error("Invalid conversion type provided"); 
        }
    }

     /*
        Delegate that converts the item we are updating to its database equivalent so that it can actually exist on the table 
    */
    public static updateConversion(body: requestSchemas.UpdateRequest) : requestSchemas.UpdateRequest {
        switch (body.Type) {
            case requestSchemas.TimesheetListItems.TABLEDATA:

                const convertedKey = this.hoursDataMappings[body.Attribute].finalKey; 
                const convertedValue = this.hoursDataMappings[body.Attribute].conversionFn(body.Data) 
                return {
                    ...body, 
                    Attribute: convertedKey, 
                    Data: convertedValue
                }
            case requestSchemas.TimesheetListItems.SCHEDULEDATA:
                throw new Error("Not yet implemented")
            case requestSchemas.TimesheetListItems.WEEKNOTES:
                throw new Error("Not yet implemented")
            default:
                throw new Error("Invalid conversion type provided"); 
        }
    } 
    
    /*
        Converts a row in our timesheet to our database equivalent from frontend. 
    */
    private static toDBRow(row: frontendRowTypes.RowSchema): dbTimesheetTypes.TimesheetEntrySchema { 
        return dbTimesheetTypes.TimesheetEntrySchema.parse({
            Type: this.toDBType(row.Type), 
            EntryID: row.UUID, 
            Date: row.Date, 
            AssociateTimes: this.toDBRowEntry(row.Associate), 
            SupervisorTimes: this.toDBRowEntry(row.Supervisor), 
            AdminTimes: this.toDBRowEntry(row.Admin), 
            Note: row.Comment?.map((comment) => this.toDBNote(comment))
        }); 
    }

    // Converts a timesheet entry to our database equivalent from frontend. 
    private static toDBRowEntry(row: frontendRowTypes.TimeRowEntry | undefined): dbTimesheetTypes.TimeEntrySchema | undefined{
        if (row !== undefined) {
            return dbTimesheetTypes.TimeEntrySchema.parse({
                StartDateTime: row.Start, 
                EndDateTime: row.End, 
                AuthorUUID: row.AuthorID
            }); 
        }
        return undefined; 
    }

    // Converts a frontend cell type to our database equivalent. 
    private static toDBType(entryType: frontendRowTypes.RowType): dbTimesheetTypes.CellType {
        switch (entryType) {
            case frontendTypes.CellType.Regular:
                return dbTimesheetTypes.CellType.REGULAR; 
            case frontendTypes.CellType.PTO:
                return dbTimesheetTypes.CellType.PTO; 
            default:
                return undefined 
        }
    }

    // Converts from our frontend week comments to our database equivalents. 
    private static toDBNotes(comments: frontendRowTypes.CommentSchema[] | undefined): dbTimesheetTypes.NoteSchema[] | undefined {
        if (comments !== undefined) {
            return comments.map((comment) => frontendEntryConversions.toDBNote(comment))
            
        }  
        return undefined;  
    }

    // Converts a singular week comment / note from our frontend to database. 
    private static toDBNote(comment: frontendRowTypes.CommentSchema | undefined): dbTimesheetTypes.NoteSchema | undefined {
        if (comment !== undefined) {
            return dbTimesheetTypes.NoteSchema.parse({
                Type: comment.Type, 
                EntryID: comment.UUID, 
                AuthorUUID: comment.AuthorID, 
                DateTime: comment.Timestamp, 
                Content: comment.Content, 
                State: comment.State 
            }); 
        }
        return undefined; 
    }

    // Converts from a singular frontend schedule entry to our database equivalent. 
    private static toDBSchedule(row: frontendRowTypes.ScheduledRowSchema): dbTimesheetTypes.ScheduleEntrySchema {
        return dbTimesheetTypes.ScheduleEntrySchema.parse({
            EntryID: row.UUID, 
            Date: row.Date, 
            StartDateTime: row.Entry?.Start, 
            EndDateTime: row.Entry?.End, 
            AuthorUUID: row.Entry?.AuthorID 
        })
    }
}