import {FrontendTimeSheetSchema} from '../frontend/TimesheetSchema'
import { TimeSheetSchema, TimesheetEntrySchema, NoteSchema, ScheduleEntrySchema, TimeEntrySchema } from './Timesheet'
import { RowSchema, CommentSchema, ScheduledRowSchema, TimeRowEntry } from '../frontend/RowSchema'

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