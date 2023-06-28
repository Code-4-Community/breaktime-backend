import * as timesheetSchemas from 'src/db/schemas/Timesheet'

import * as constants from 'src/constants'
import { v4 as uuidv4 } from 'uuid';

import {UserTimesheets, WriteEntryToTable} from 'src/dynamodb'
import { DBToFrontend } from './FrontendConversions';

const moment = require('moment-timezone'); 


export class Formatter {
    /*
        Processes the timesheets we are grabbing for a user to ensure they are properly prepared 
        for the user - i.e. any missing days are added, etc. 
    */

    // Fetches timesheets and properly formats them to our frontend data versions. 
    public static async fetch_user_timesheets(userid: string) {
        //Grab timesheets from DB 
        var timesheets =  await UserTimesheets(userid); 
        //Convert to Frontend equivalents and convert 
        timesheets = this.format(timesheets); 
        

        return DBToFrontend.convertTimesheets(timesheets); 
    }

    // Formats a list of backend / database timesheets to the frontend equivalents.   
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

    // Main method all other future methods delegate to / would return to when we are processing a timesheet to convert to frontend 
    private static validate(timesheet): [timesheetSchemas.TimeSheetSchema, boolean] {
        //When more functions are introduced here, create logic to determine whether any modified it to return 
        return this.ensure_all_days(timesheet); 
    }

    private static ensure_all_days(timesheet:timesheetSchemas.TimeSheetSchema): [timesheetSchemas.TimeSheetSchema, boolean] {
        /*
            Ensures that for each day from START_DATE to START_DATE + TIMESHEET_DURATION that each day has at-least one entry 
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
    //Creates an empty row in the timesheet for a specified date. 
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