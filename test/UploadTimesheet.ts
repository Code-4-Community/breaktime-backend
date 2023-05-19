
import { TimeSheetSchema, TimesheetStatus, TimesheetEntrySchema, CellType, TimeEntrySchema } from "../src/db/schemas/Timesheet"
import { v4 as uuidv4 } from 'uuid';
import { WriteEntryToTable } from "../src/dynamodb";
//No idea why this require statement is needed but moment breaks otherwise :( 
const moment = require('moment-timezone'); 
/***********************************************
Utils file used in testing to upload entire timesheets 
*/



const TIMEZONE = "America/New_York"; 
const UUID = "77566d69-3b61-452a-afe8-73dcda96f876"

function createTimeEntry(start, end) {
    return TimeEntrySchema.parse({
        StartDateTime: start, 
        EndDateTime: end, 
        AuthorUUID: UUID
    }); 
}

function createEntry(cellType, date, associate, note) {
    return TimesheetEntrySchema.parse({
        Type: cellType, 
        EntryID: uuidv4(), 
        Date: date, 
        AssociateTimes: associate, 
        SupervisorTimes: undefined, 
        AdminTimes: undefined, 
        Note: note
    }); 
}

const current = moment().tz(TIMEZONE); 

const daysOfWeek = moment().tz(TIMEZONE).startOf('week'); 

const timesheetToUpload = TimeSheetSchema.parse({
    TimesheetID: 12931231, 
    UserID: UUID, 
    StartDate: moment().tz(TIMEZONE).startOf('week').day(0).unix(), 
    Status: TimesheetStatus.parse({
        HoursSubmitted: undefined, 
        HoursReviewed: undefined, 
        ScheduleSubmitted: undefined, 
        Finalized: undefined 
    }), 
    CompanyID: "Example Company 1", 
    HoursData: [
        createEntry(CellType.REGULAR, daysOfWeek.day(1).unix(), undefined, undefined), 
        createEntry(CellType.PTO, daysOfWeek.day(2).unix(), undefined, undefined), 
        createEntry(CellType.REGULAR, daysOfWeek.day(5).unix(), createTimeEntry(100, 500), undefined)
    ], 
    ScheduleData: [], 
    WeekNotes: []
})

export function run() {
    console.log("Uploading timesheet!"); 
    WriteEntryToTable(timesheetToUpload); 
    console.log("Success :)"); 
}
