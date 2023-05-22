import * as timesheetSchemas from 'src/db/schemas/Timesheet'

import * as constants from 'src/constants'
import { v4 as uuidv4 } from 'uuid';

import {UserTimesheets, WriteEntryToTable} from 'src/dynamodb'
import { DBToFrontend } from '../schemas/FrontendConversions';

const moment = require('moment-timezone'); 


export class Formatter {
    /*
        Processes the timesheets we are grabbing for a user to ensure they are properly prepared 
        for the user - i.e. any missing days are added, etc. 
    */

    public static async fetch_user_timesheets(userid: string) {
        //Grab timesheets from DB 
        var timesheets =  await UserTimesheets(userid); 
        //Convert to Frontend equivalents and convert 
        timesheets = this.format(timesheets); 
        

        return DBToFrontend.convertTimesheets(timesheets); 
    }

    public static format(timesheets: timesheetSchemas.TimeSheetSchema[]) : timesheetSchemas.TimeSheetSchema[] {
        const updatedTimesheets =  timesheets.map((timesheet) => {
            const [updatedTimesheet, modified] =  this.validate(timesheet); 
            if (modified) {
                //If this timesheet was modified we should re-upload it 
                WriteEntryToTable(updatedTimesheet); 
            }
            return updatedTimesheet; 
        })
        return updatedTimesheets
        
    }

    // Main method all other future methods delegate to / would return to 
    private static validate(timesheet): [timesheetSchemas.TimeSheetSchema, boolean] {
        //When more functions are introduced here, create logic to determine whether any modified it to return 
        return this.ensure_all_days(timesheet); 
    }

    private static ensure_all_days(timesheet:timesheetSchemas.TimeSheetSchema): [timesheetSchemas.TimeSheetSchema, boolean] {
        /*
            Ensures that there is a TIMESHEET_DURATION amount of rows in the timesheet, 
            meaning that each day has an entry in the timesheet 
        */
        var modifiedRows = false; 

        const updatedRows = [] 
        var endDate = moment.unix(timesheet.StartDate).add(constants.TIMESHEET_DURATION - 1, 'days'); 
        var currentDate = moment.unix(timesheet.StartDate); 

        timesheet.HoursData?.map((row) => {
            const rowDate = moment.unix(row.Date); 
            while (rowDate.isAfter(currentDate, 'day')) {
                modifiedRows = true; 
                updatedRows.push(this.create_empty_row(currentDate.unix())); 
                currentDate = currentDate.add(1, 'day'); 
            }
            updatedRows.push(row); 
            currentDate = currentDate.add(1, 'day'); 
        }); 
        // Fill in remaining daysd
        while (!currentDate.isAfter(endDate, 'day')){
            modifiedRows = true; 
            updatedRows.push(this.create_empty_row(currentDate.unix())); 
            currentDate = currentDate.add(1, 'day'); 
        }
        //Returns the updated timesheet and whether or not it was modified 
        return [
            timesheetSchemas.TimeSheetSchema.parse(
            {...timesheet, 
                HoursData: updatedRows 
            }
        ), modifiedRows]; 

    }
    private static create_empty_row(date: number): timesheetSchemas.TimesheetEntrySchema {
        return timesheetSchemas.TimesheetEntrySchema.parse({
            Type: timesheetSchemas.CellType.REGULAR, 
            EntryID: uuidv4(), 
            Date: date, 
            AssociateTimes: undefined, 
            SupervisorTimes: undefined, 
            AdminTimes: undefined, 
            Note: []
        })
    }
}