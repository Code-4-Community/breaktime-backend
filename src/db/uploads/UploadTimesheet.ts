import { FrontendToDB } from "../schemas/FrontendConversions";
import { FrontendTimeSheetSchema } from "../frontend/TimesheetSchema";
import { TimesheetUpdateRequest, TimesheetOperations } from "../schemas/UpdateTimesheet";

import {UserTimesheets} from "src/dynamodb"
import { ExceptionsHandler } from "@nestjs/core/exceptions/exceptions-handler";
import { ItemsDelegator } from "./ItemsOperations";


export class UploadTimesheet {
    
    delegator = new ItemsDelegator() 

    public async updateTimesheet(request: TimesheetUpdateRequest, userid: string): Promise<string> {
        /*
            Provided a request to update a timesheet, processes and returns if it was 
            able to successfully update it or false if it was unsuccessful 

            request: The request we are processing 
            userid: The user we are processing this for 
        */
        
        //Retrieve a specified timesheet 
        const userTimesheets = await UserTimesheets(userid); 
        const selectedTimesheet = userTimesheets.filter((timesheet) => timesheet.TimesheetID === request.TimesheetID)
        if (selectedTimesheet.length == 1) {

            var modifiedTimesheet = undefined; 

            switch (request.Operation) {
                case TimesheetOperations.STATUS_CHANGE:
                    //TODO - Create the functionality for actually incrementing state - 
                    break; 
                case TimesheetOperations.DELETE: 
                    modifiedTimesheet =  this.delegator.Delegate(request.Payload).Delete(selectedTimesheet[0], request.Payload); 
                    break; 
                case TimesheetOperations.INSERT:
                    modifiedTimesheet =  this.delegator.Delegate(request.Payload).Insert(selectedTimesheet[0], request.Payload); 
                    break; 
                case TimesheetOperations.UPDATE:
                    modifiedTimesheet =  this.delegator.Delegate(request.Payload).Update(selectedTimesheet[0], request.Payload); 
                    break; 
                default: 
                    throw new Error(`Invalid operation: ${request.Operation}`); 
            }
            if (modifiedTimesheet !== undefined) {
                //TODO - Upload this back to the DB? 
                // Done? :) 
                return "Success :)"
            }
            return "Failure"; 
        } else if (selectedTimesheet.length > 1) {
            throw new Error("Multiple timesheets have the same timesheet ID for this user"); 
        } else {
            throw new Error("No Timesheet with that ID"); 
        }
    }
}