import { TimeSheetSchema, TimesheetStatus } from "../src/db/schemas/Timesheet"
const moment = require('moment-timezone'); 

export const timesheetToUpload = (UUID: string, CompanyID: string) => 
{
    return TimeSheetSchema.parse({
        TimesheetID: Math.round(Math.random() * 1000000000), 
        UserID: UUID, 
        StartDate: moment().startOf('week').day(0).unix(), 
        Status: TimesheetStatus.parse({
            HoursSubmitted: undefined, 
            HoursReviewed: undefined, 
            ScheduleSubmitted: undefined, 
            Finalized: undefined 
        }), 
        CompanyID: CompanyID, 
        HoursData: [],  
        ScheduleData: [], 
        WeekNotes: []
    })
}