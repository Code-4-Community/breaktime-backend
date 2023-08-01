import { TimeSheetSchema } from "./db/Timesheet"
import { TimesheetStatus } from "./db/schemas/Timesheet";
const moment = require('moment-timezone'); 


export const timesheetToUpload = (UUID: string, CompanyID: string) => 
TimeSheetSchema.parse({
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