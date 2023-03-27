import { Controller, Get, Post, Headers } from '@nestjs/common';
// import { ApiTags } from '@nestjs/swagger';
// import { Role } from '../user/types/role';
// import { User } from '../user/types/user.entity';
import { AuthService } from './auth.service';
// import { Auth } from './decorators/auth.decorator';
// import { ReqUser } from './decorators/user.decorator';
import {WriteEntryToTable, UserTimesheets} from '../dynamodb'; 

import TokenClient from './cognito/cognito.keyparser'
import { TimeSheetSchema } from 'src/db/Timesheet';

// @ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /** 
   * Must be authenticated. Returns the User making the request.
   */
  @Get('me')
  me() : String {
    return "Auth endpoint was served "; 
  }
  @Post('timesheet')
  upload_timesheet(): String {
    WriteEntryToTable({
      TimesheetID:1293219, 
      UserID:"1896731b-3126-4678-86cb-ef199330b3ed", 
      StartDate:1679918400,  
      Status:"Accepted", 
      Company:"Breaktime",
      TableData:"{}"
    }); 
    return "Success!"  
  }
  @Get('timesheet')
  public async grab_timesheets(@Headers() headers: any): Promise<TimeSheetSchema[]> {
    if (headers.hasOwnProperty('authorization')) {
      const resp = await TokenClient.verifyJWT(headers.authorization); 
      const UserID = resp.sub; 
      
      console.log("Fetching timesheets for user ", UserID); 
      const timesheets = await UserTimesheets(UserID)
      console.log(timesheets); 
      return timesheets; 
  
    }
    return []; 
  } 
}
