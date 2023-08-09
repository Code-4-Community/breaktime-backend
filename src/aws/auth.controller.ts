import {
  Controller,
  Get,
  Post,
  Headers,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { getTimesheetsForUsersInGivenTimeFrame, doUUIDSExistInCompanies, GetCompaniesForUser, areUUIDsValid } from "../dynamodb";
import TokenClient from './cognito/cognito.keyparser'
import { TimeSheetSchema } from 'src/db/schemas/Timesheet';
import * as frontendTimesheetSchemas from 'src/db/schemas/Timesheet'
import { Roles } from "src/utils/decorators/roles.decorators"; // idk if this is correct
import { RolesGuard } from 'src/utils/guards/roles.guard';
import { UploadTimesheet } from 'src/db/timesheets/UploadTimesheet';
import { TimesheetUpdateRequest } from 'src/db/schemas/UpdateTimesheet';
import { Formatter } from 'src/db/timesheets/Formatter';

@Controller("auth")
@UseGuards(RolesGuard)
export class AuthController {

  uploadApi = new UploadTimesheet(); 

  constructor(private authService: AuthService) {}

  @Post('timesheet')
  public async upload_timesheet(
    @Headers() headers: any,
    @Body() body: any
  ): Promise<string> {
    const userId = await TokenClient.grabUserID(headers); 
    if (userId) {
      console.log("Writing")
      const result = this.uploadApi.updateTimesheet(body, userId); 
      //Do something with this result? 
      return "Success"; 
    }
  }
  @Get("timesheet")
  //@Roles('breaktime-management-role')
  
  public async grab_timesheets(@Headers() headers: any): Promise<frontendTimesheetSchemas.TimeSheetSchema[]> {
    const userId = await TokenClient.grabUserID(headers); 

    if (userId) {
      console.log("Fetching timesheets for user ", userId); 
      return Formatter.fetchUserTimesheets(userId); 
     
    } 
    return []; 
  }

  @Get("getTimesheet")
  //@Roles('breaktime-management-role')
  //@Roles("breaktime-admin", "breaktime-supervisor")
  public async get_timesheets(
    @Headers() headers: any,
    @Query("userIds") userIDs?: string[]
  ): Promise<uuidToTimesheetMapping[]> {
    // if supervisors dont have access to a uuid throw an error
    // if supervisor or admin request non existent uuid throw an error

    // if supervisor ensure all uuids are in company
    // if admin just make sure theyre all valid 

    // if associate only return their timesheet

    const userID = await TokenClient.grabUserID(headers);
    let areAllUUIDsValid;

    if (!userIDs) {
      if (1 == 1) { // associate
        userIDs = [userID]
      } else if (2 === 2) { // supervisor
        userIDs = [] // get all users in their companies
      } else if (3 === 3) { // admin
        userIDs = [] // get all users they own
      } else {
        // no role no access
        // throw error
      }
    }

    if (1 === 1) { // associate
      areAllUUIDsValid = (userIDs.length === 1 &&  userID === userIDs[0])

    } else if (2 === 2) { // supervisor
      const supervisorCompanies = (await GetCompaniesForUser(userID)).SupervisorCompanyIDs
      areAllUUIDsValid = await doUUIDSExistInCompanies(userIDs, supervisorCompanies)

    } else if (3 === 3) { //admin
      areAllUUIDsValid = await areUUIDsValid(userIDs);

    } else {
      // no role no access
      // throw error
    }

    if (areAllUUIDsValid) {
      return await getTimesheetsForUsersInGivenTimeFrame(userIDs);
    } else{
      // throw error
    }

    //await getTimesheetsForUsersInGivenTimeFrame(['77566d69-3b61-452a-afe8-73dcda96f876']);
  }
}

export type uuidToTimesheetMapping = {
  uuid: string,
  timesheet: TimeSheetSchema
};