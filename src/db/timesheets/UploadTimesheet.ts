import { DBToFrontend } from "./FrontendConversions";
import { FrontendTimeSheetSchema } from "../frontend/TimesheetSchema";
import { TimesheetUpdateRequest, TimesheetOperations } from "../schemas/UpdateTimesheet";

import {UserTimesheets} from "src/dynamodb"
import { ExceptionsHandler } from "@nestjs/core/exceptions/exceptions-handler";
import { ItemsDelegator } from "./ItemsOperations";

import {WriteEntryToTable} from "src/dynamodb"
import {frontendEntryConversions} from './EntryOperations'

export class UploadTimesheet {
    
    private delegator = new ItemsDelegator() 

    public async updateTimesheet(request: TimesheetUpdateRequest, userid: string): Promise<string> {
        /*
            Provided a request to update a timesheet, processes the request and then 
            return a response indicating success or failure. 

            request: The request we are processing 
            userid: The user we are processing this for 
        */
        //Retrieve a specified timesheet 
        const userTimesheets = await UserTimesheets(userid); 
        const selectedTimesheet = userTimesheets.filter((timesheet) => timesheet.TimesheetID === request.TimesheetID)
        if (selectedTimesheet.length == 1) {
            
            var modifiedTimesheet = undefined; 
            //TODO - Mutate the respective fields to what they should be 
            switch (request.Operation) {
                case TimesheetOperations.STATUS_CHANGE:
                    //TODO - Create the functionality for actually incrementing state : This should handle the StatusCompliation object
                    break; 
                case TimesheetOperations.DELETE: 
                    modifiedTimesheet =  this.delegator.AttributeToModify(request.Payload).Delete(selectedTimesheet[0], request.Payload); 
                    break; 
                case TimesheetOperations.INSERT:
                    //Determine attribute we are modifying and then also convert the field from frontend to backend. 
                    modifiedTimesheet =  this.delegator.AttributeToModify(request.Payload).Insert(selectedTimesheet[0], 
                        frontendEntryConversions.insertConversion(request.Payload)); 
                    break; 
                case TimesheetOperations.UPDATE:
                    //Determine attribute we are modifying and then also convert the field from frontend to backend. 
                    modifiedTimesheet =  this.delegator.AttributeToModify(request.Payload).Update(selectedTimesheet[0],
                         frontendEntryConversions.updateConversion(request.Payload)); 

                    break; 
                default: 
                    throw new Error(`Invalid operation: ${request.Operation}`); 
            }
            if (modifiedTimesheet !== undefined) {
                WriteEntryToTable(modifiedTimesheet); 
                return "Success :)"
            }
            return "Failure"; 
        } else if (selectedTimesheet.length > 1) {
            throw new Error("Multiple timesheets have the same timesheet ID for this user"); 
        } else {
            return "Error! No Timesheet with that ID!"
            // throw new Error("No Timesheet with that ID"); 
        }
    }
}