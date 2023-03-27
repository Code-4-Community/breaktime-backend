import { Controller, Get, Post, Headers , Body} from '@nestjs/common';
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
  public async upload_timesheet(@Headers() headers: any, @Body() body: any): Promise<string> {
    const userId = await TokenClient.grabUserID(headers); 
    if (userId) {
      console.log("Writing")
      WriteEntryToTable(body.timesheet); 
    }

    return "Success!"  
  }
  @Get('timesheet')
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
