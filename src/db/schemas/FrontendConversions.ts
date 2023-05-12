import {FrontendTimeSheetSchema} from '../frontend/TimesheetSchema'
import { TimeSheetSchema, TimesheetEntrySchema, NoteSchema, ScheduleEntrySchema, TimeEntrySchema } from './Timesheet'
import { RowSchema, CommentSchema, ScheduledRowSchema, TimeRowEntry } from '../frontend/RowSchema'


/*
    Abstracted operations on [TableData, ScheduleTableData, WeekNotes]: 
        INSERT: Insert an item into the list 
        UPDATE: Update a specific item in the list 
        DELETE: Delete an item from the specified list 
    STATUS_CHANGE: Update the status of a timesheet 
    NOTES_INSERT: 
*/

export enum TimesheetOperations {
    INSERT = "INSERT", 
    UPDATE = "UPDATE", 
    DELETE = "DELETE", 
    STATUS_CHANGE = "STATUS_CHANGE", 
    TIMESHEET_CREATE = "TIMESHEET_CREATE"
}

export class FrontendToDB {

    private mappings = {
        Associate: this.toDBRowEntry, 
        Supervisor: this.toDBRowEntry, 
        Admin: this.toDBRowEntry, 
        Comment: this.toDBComments, 

    }

    public convertField(field:string, value) {

    }

    /*
        Mapper for converting from a frontend timesheet schema to a backend one 
    */
    public toDBTimesheet(timesheet:FrontendTimeSheetSchema):TimeSheetSchema {
        return TimeSheetSchema.parse({
            TimesheetID: timesheet.TimesheetID, 
            UserID: timesheet.UserID, 
            StartDate: timesheet.StartDate, 
            Status: timesheet.StartDate, 
            CompanyID: timesheet.CompanyID, 
            HoursData: this.toDBRows(timesheet.TableData),
            ScheduleData: this.toDBScheduledRows(timesheet.ScheduleTableData), 
            WeekNotes: this.toDBComments(timesheet.WeekNotes) 
        }); 
    }

    private toDBRows(rows: RowSchema[]): TimesheetEntrySchema[] {
        return rows.map((row) => {
            return TimesheetEntrySchema.parse({
                Type: row.Type, 
                Date: row.Date, 
                AssociateTimes: this.toDBRowEntry(row.Associate),
                SupervisorTimes: this.toDBRowEntry(row.Supervisor), 
                AdminTimes: this.toDBRowEntry(row.Admin), 
                Note: this.toDBComments(row.Comment)
            }) 
        })
    }


    private toDBScheduledRows(rows: ScheduledRowSchema[]):ScheduleEntrySchema[] {
        if (rows !== undefined) {
            return rows.map((row) => {
                return ScheduleEntrySchema.parse({
                    Date: row.Date, 
                    StartDateTime: row.Entry?.Start, 
                    EndDateTime: row.Entry?.End,
                    AuthorUUID: row.Entry?.AuthorID 
                }); 
            })
        }
        return rows 
    }
    private toDBRowEntry(row: TimeRowEntry | undefined): TimeEntrySchema | undefined{
        if (row !== undefined) {
            return TimeEntrySchema.parse({
                StartDateTime: row.Start, 
                EndDateTime: row.End, 
                AuthorUUID: row.AuthorID
            }); 
        }
        return undefined; 
    }



    private toDBComments(comments: CommentSchema[] | undefined): NoteSchema[] {
        if (comments !== undefined) {
            return comments.map((comment) => {
                return NoteSchema.parse({
                    Type: comment.Type, 
                    AuthorUUID: comment.AuthorID, 
                    DateTime: comment.Timestamp, 
                    Content: comment.Content, 
                    State: comment.State
                }); 
            })
        }
        return [];
    }
}

export class DBToFrontend {
    /*
        Mapper from converting from a Database backend timesheet to a frontend one 
    */
    public toFrontendTimesheet(timesheet: TimeSheetSchema): FrontendTimeSheetSchema {
        return FrontendTimeSheetSchema.parse({
            TimesheetID: timesheet.TimesheetID, 
            UserID: timesheet.UserID, 
            StartDate: timesheet.StartDate, 
            Status: timesheet.Status, 
            CompanyID: timesheet.CompanyID, 
            TableData: this.toFrontendRows(timesheet.HoursData),
            ScheduleTableData: this.toFrontendScheduleData(timesheet.ScheduleData), 
            WeekNotes: this.toFrontendComment(timesheet.WeekNotes) 

        }); 
    }
    private toFrontendRows(rows: TimesheetEntrySchema[]): RowSchema[] {
        return rows.map((row) => {
            return RowSchema.parse({
                Type: row.Type, 
                Date: row.Date, 
                Associate: this.toFrontendRowEntry(row.AssociateTimes), 
                Supervisor: this.toFrontendRowEntry(row.SupervisorTimes), 
                Admin: this.toFrontendRowEntry(row.AdminTimes), 
                Comment: this.toFrontendComment(row.Note)
            }); 
        })
    }
    private toFrontendScheduleData(rows: ScheduleEntrySchema[]): ScheduledRowSchema[] {
        return rows.map((row) => {
            return ScheduledRowSchema.parse({
                Date: row.Date, 
                Entry: TimeRowEntry.parse({
                    Start: row.StartDateTime, 
                    End: row.EndDateTime, 
                    AuthorID: row.AuthorUUID
                })
            }); 
        })
    }

    private toFrontendRowEntry(row: TimeEntrySchema): TimeRowEntry {
        return TimeRowEntry.parse({
            Start: row.StartDateTime, 
            End: row.EndDateTime, 
            AuthorID: row.AuthorUUID
        })
    }

    private toFrontendComment(comments: NoteSchema[]): CommentSchema[] {
        return comments.map((comment) => {
            return CommentSchema.parse({
                AuthorID: comment.AuthorUUID, 
                Type: comment.Type, 
                Timestamp: comment.DateTime, 
                Content: comment.Content, 
                State: comment.State
            }); 
        })
    }
}