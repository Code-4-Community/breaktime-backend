import { Controller, Get, Post } from '@nestjs/common';
// import { ApiTags } from '@nestjs/swagger';
// import { Role } from '../user/types/role';
// import { User } from '../user/types/user.entity';
import { AuthService } from './auth.service';
// import { Auth } from './decorators/auth.decorator';
// import { ReqUser } from './decorators/user.decorator';
import {WriteEntryToTable, UserTimesheets} from '../dynamodb'; 

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
    console.log("WE ARE UPLOADING TO THE TABLE"); 
    WriteEntryToTable({
      TimesheetID:1293219, 
      UUID:1293921, 
      StartDate:1293921, 
      Status:"Accepted",
      Company:"Breaktime",
      TableData:"{}"
    }); 
    return "Success!"  
  }
  @Get('timesheet')
  grab_timesheets(): String {
    console.log("WE ARE Grabbing timesheets for user"); 
     UserTimesheets(123).then(response => {
      console.log(response); 
     })
    return "Success!"  
  } 
}
