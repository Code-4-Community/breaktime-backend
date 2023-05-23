import * as dbTypes from './Timesheet'
import * as frontendRowTypes from '../frontend/RowSchema'
import * as frontendTimesheetTypes from '../frontend/TimesheetSchema'
export class DBToFrontend {
    /*
        Mapper from converting from a Database backend timesheet to a frontend one 
    */ 

    public static convertTimesheets(timesheets: dbTypes.TimeSheetSchema[]) : frontendTimesheetTypes.FrontendTimeSheetSchema[] {
        return timesheets.map((timesheet) => this.toFrontendTimesheet(timesheet)); 
    }

    public static toFrontendTimesheet(timesheet: dbTypes.TimeSheetSchema): frontendTimesheetTypes.FrontendTimeSheetSchema {
        return frontendTimesheetTypes.FrontendTimeSheetSchema.parse({
            TimesheetID: timesheet.TimesheetID, 
            UserID: timesheet.UserID, 
            StartDate: timesheet.StartDate, 
            Status: this.toFrontendStatus(timesheet.Status), 
            CompanyID: timesheet.CompanyID, 
            TableData: this.toFrontendRows(timesheet.HoursData),
            ScheduleTableData: this.toFrontendScheduleData(timesheet.ScheduleData), 
            WeekNotes: this.toFrontendComments(timesheet.WeekNotes) 
        }); 
    }

    private static toFrontendStatus(status: dbTypes.TimesheetStatus): frontendTimesheetTypes.StatusType {
        return frontendTimesheetTypes.StatusType.parse({
            HoursSubmitted: status.HoursSubmitted, 
            HoursReviewed: status.HoursReviewed, 
            ScheduleSubmitted: status.ScheduleSubmitted, 
            Finalized: status.Finalized
        })
    } 

    private static toFrontendRows(rows: dbTypes.TimesheetEntrySchema[]): frontendRowTypes.RowSchema[] {
        if (rows === undefined) {
            return []; 
        }
        return rows.map((row) => {
            return frontendRowTypes.RowSchema.parse({ 
                UUID: row.EntryID, 
                Type: row.Type, 
                Date: row.Date, 
                Associate: this.toFrontendRowEntry(row.AssociateTimes), 
                Supervisor: this.toFrontendRowEntry(row.SupervisorTimes), 
                Admin: this.toFrontendRowEntry(row.AdminTimes), 
                Comment: this.toFrontendComments(row.Note)
            }); 
        })
    }
    private static toFrontendScheduleData(rows: dbTypes.ScheduleEntrySchema[]): frontendRowTypes.ScheduledRowSchema[] {
        if (rows === undefined) {
            return []; 
        }
        return rows.map((row) => {
            return frontendRowTypes.ScheduledRowSchema.parse({
                UUID: row.EntryID, 
                Date: row.Date, 
                Entry: frontendRowTypes.TimeRowEntry.parse({
                    Start: row.StartDateTime, 
                    End: row.EndDateTime, 
                    AuthorID: row.AuthorUUID
                })
            }); 
        })
    }

    private static toFrontendRowEntry(row: dbTypes.TimeEntrySchema): frontendRowTypes.TimeRowEntry {
        if (row === undefined) {
            return undefined; 
        } 
        return frontendRowTypes.TimeRowEntry.parse({
            Start: row.StartDateTime, 
            End: row.EndDateTime, 
            AuthorID: row.AuthorUUID
        })
    }

    private static toFrontendComments(comments: dbTypes.NoteSchema[]): frontendRowTypes.CommentSchema[] {
        if (comments === undefined) {
            return []; 
        }
        return comments.map((comment) => {
            return frontendRowTypes.CommentSchema.parse({
                UUID: comment.EntryID, 
                AuthorID: comment.AuthorUUID, 
                Type: comment.Type, 
                Timestamp: comment.DateTime, 
                Content: comment.Content, 
                State: comment.State
            }); 
        })
    }
}