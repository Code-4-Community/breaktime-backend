import * as frontendRowTypes from '../frontend/RowSchema'
import * as dbTimesheetTypes from '../schemas/Timesheet'
import * as requestSchemas from '../schemas/UpdateTimesheet'
import {FrontendTimeSheetSchema} from '../frontend/TimesheetSchema'
import * as frontendTypes from '../frontend/CellTypes'

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
    private static hoursDataMappings = {
        Type: new KeyPairMappings("Type", "Type", frontendEntryConversions.toDBType), 
        Associate: new KeyPairMappings("Associate", "AssociateTimes", frontendEntryConversions.toDBRowEntry),
        Supervisor: new KeyPairMappings("Supervisor", "SupervisorTimes", frontendEntryConversions.toDBRowEntry), 
        Admin: new KeyPairMappings("Admin", "AdminTimes", frontendEntryConversions.toDBRowEntry),
        Note: new KeyPairMappings("Comment", "Note", frontendEntryConversions.toDBNote)
    }
  

    public static insertConversion(body: requestSchemas.InsertRequest) : requestSchemas.InsertRequest {
        //TODO - figure out wtf im doing here 
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
    
    
    private static toDBRow(row: frontendRowTypes.RowSchema): dbTimesheetTypes.TimesheetEntrySchema { 
        return dbTimesheetTypes.TimesheetEntrySchema.parse({
            Type: this.toDBType(row.Type), 
            EntryID: row.UUID, 
            Date: row.Date, 
            AssociateTimes: this.toDBRowEntry(row.Associate), 
            SupervisorTimes: this.toDBRowEntry(row.Supervisor), 
            AdminTimes: this.toDBRowEntry(row.Admin), 
            Note: row.Comment.map((comment) => this.toDBNote(comment))
        }); 
    }

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

    private static toDBNote(comment: frontendRowTypes.CommentSchema | undefined): dbTimesheetTypes.NoteSchema {
        if (comment !== undefined) {
            return dbTimesheetTypes.NoteSchema.parse({
                Type: comment.Type, 
                AuthorUUID: comment.AuthorID, 
                DateTime: comment.Timestamp, 
                Content: comment.Content, 
                State: comment.State
            }); 
        }
        return undefined; 
    }

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