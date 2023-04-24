import { Controller, Get, Headers, UseGuards, Query} from '@nestjs/common';
import { GetCompaniesForUser } from '../dynamodb'; 
import { RolesGuard } from 'src/aws/guards/roles.guard';
import { Roles } from 'src/aws/decorators/roles.decorators';
import { AuthService } from 'src/aws/auth.service';
import TokenClient from 'src/aws/cognito/cognito.keyparser'




@Controller('user')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private authService: AuthService) {}
  
  /**
   * Gets all the user data from a certain company/companies and returns and array. If no company ID is given, 
   * we'll default to use the companies that the requesting user belongs to as the filter. If the user is an admin, return all users
   * unless a company ID is specified.
   * 
   * @param companyID an optional filter query to get users only from this company
   * @throws some error if the companyID requested is not one that the user belongs, maybe 403 forbidden??
   * @returns an array of Company objects that contain the companyID and associated User data
   */
  @Get('users')
  @Roles('breaktime-admin', 'breaktime-supervisor')
  public async getAllUsers(@Headers() headers: any, @Query('companyId') companyIDs?: string[]): Promise<CompanyUsers[]> {
    const userId = await TokenClient.grabUserID(headers); 

    if (userId) {

      // Get companyId(s) associated with user if no ids were provided via the queries
      if (companyIDs === undefined || companyIDs.length === 0) {
        companyIDs = (await GetCompaniesForUser(userId)).SupervisorCompanyIDs;
      }
  
      // get all users associated with companyId(s)
      // This will be db call with companyIds as a filter on the query
      // This only gets the UserIDs, NOT all the user info
  
      // HOW DO WE GET USER DATA??? -> from Cognito
  
      // Separate into company objects, filter users from db query, and create final array
      // Option 2: array of Map objects [ {"companyID": "company1", "users": [User1, User2]}, {"companyID": "company2", "users": [User3]}, etc... ]
  
      // return company array
  
    }
    return []; 
  }

}

export type CompanyUsers = {"companyName": string, "userIDs": string[]};


