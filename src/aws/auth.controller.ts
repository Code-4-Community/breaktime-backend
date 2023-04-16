import { Controller, Get, Post, Headers , Body, UseGuards, Param} from '@nestjs/common';
import { AuthService } from './auth.service';
import {WriteEntryToTable, UserTimesheets} from '../dynamodb'; 

import TokenClient from './cognito/cognito.keyparser'
import { TimeSheetSchema } from 'src/db/Timesheet';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorators';

@Controller('auth')
@UseGuards(RolesGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('timesheet')
  public async upload_timesheet(@Headers() headers: any, @Body() body: any): Promise<string> {
    const userId = await TokenClient.grabUserID(headers); 
    if (userId) {
      console.log("Writing")
      WriteEntryToTable(body.timesheet); 
    }

    return "Success!"  
  }
  
  @Get('timesheet')
  @Roles('breaktime-admin')
  public async grab_timesheets(@Headers() headers: any): Promise<TimeSheetSchema[]> {
    const userId = await TokenClient.grabUserID(headers); 

    if (userId) {
      console.log("Fetching timesheets for user ", userId); 
      const timesheets = await UserTimesheets(userId)
      return timesheets; 
    }
    return []; 
  }
}
