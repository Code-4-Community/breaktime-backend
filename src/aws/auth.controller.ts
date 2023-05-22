import { Controller, Get, Post, Headers , Body, UseGuards} from '@nestjs/common';
import { AuthService } from './auth.service';
import {WriteEntryToTable, UserTimesheets} from '../dynamodb'; 

import TokenClient from './cognito/cognito.keyparser'
import { TimeSheetSchema } from 'src/db/schemas/Timesheet';
import * as frontendTimesheetSchemas from 'src/db/schemas/Timesheet'
import { RolesGuard } from 'src/utils/guards/roles.guard';

import { UploadTimesheet } from 'src/db/timesheeets/UploadTimesheet';
import { TimesheetUpdateRequest } from 'src/db/schemas/UpdateTimesheet';
import {DBToFrontend} from 'src/db/schemas/FrontendConversions'

import { Formatter } from 'src/db/timesheeets/Formatter';

@Controller('auth')
@UseGuards(RolesGuard)
export class AuthController {

  uploadApi = new UploadTimesheet(); 

  constructor(private authService: AuthService) {}

  @Post('timesheet')
  public async upload_timesheet(@Headers() headers: any, @Body() body: TimesheetUpdateRequest): Promise<string> {
    const userId = await TokenClient.grabUserID(headers); 
    
    if (userId) {
      console.log("Writing")
      
      const result = this.uploadApi.updateTimesheet(body, userId); 
      //Do something with this result? 
      return "Success"; 
    }
    return "Failure"; 

  }
  
  @Get('timesheet')
  //@Roles('breaktime-management-role')
  
  public async grab_timesheets(@Headers() headers: any): Promise<frontendTimesheetSchemas.TimeSheetSchema[]> {
    const userId = await TokenClient.grabUserID(headers); 

    if (userId) {
      console.log("Fetching timesheets for user ", userId); 

      return Formatter.fetch_user_timesheets(userId); 
     
    } 
    return []; 
  }
}
