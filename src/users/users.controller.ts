import { Controller, Get, Headers, UseGuards, Query} from '@nestjs/common';
import { GetCompaniesForUser, GetCompanyData } from '../dynamodb'; 
import { Roles } from 'src/utils/decorators/roles.decorators';
import TokenClient from 'src/aws/cognito/cognito.keyparser'
import { RolesGuard } from 'src/utils/guards/roles.guard';
import { UserService } from './user.service';
import { User } from './User.model';

@Controller('user')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private userService: UserService) {}
  
  /**
   * Gets all the user data from a certain company/companies and returns and array. If no company ID is given, 
   * we'll default to use the companies that the requesting user belongs to as the filter. If the user is an admin, return all users
   * unless a company ID is specified.
   * 
   * @param companyID an optional filter query to get users only from this company
   * @param roles an filter query to specify which users to get by roles (associate, supervisor, and/or admin); by default, will be only associates
   * @throws some error if the companyID requested is not one that the user belongs, maybe 403 forbidden??
   * @returns an array of Company objects that contain the companyID and associated User data
   */
  @Get('users')
  //@Roles('breaktime-admin', 'breaktime-supervisor')
  public async getAllUsers(@Headers() headers: any, @Query('companyIds') companyIDs?: string[], @Query('roles') roles: string[] = ['associate']): Promise<CompanyUsers[]> {
    const userId = await TokenClient.grabUserID(headers); 
    console.log(userId);

    if (!userId) {
      return [];
    }

    // Get companyId(s) associated with user if no ids were provided via the queries
    if (companyIDs === undefined || companyIDs.length === 0) {
      companyIDs = (await GetCompaniesForUser(userId)).SupervisorCompanyIDs;
    }
    console.log(companyIDs);

    const companyUserList: CompanyUsers[] = [];

    // get all users associated with companyId(s)
    for (const companyId of companyIDs) {
      // This will be db call with companyIds as a filter on the query
      // This only gets the UserIDs, NOT all the user info
      const companyData = await GetCompanyData(companyId);
      let targetUsers = [];

      if (roles.includes('associate')) {
        targetUsers = targetUsers.concat(companyData.AssociateIDs);
      }

      if (roles.includes('supervisor')) {
        targetUsers = targetUsers.concat(companyData.SupervisorIDs);
      }

      // For testing purposes, use this testList instead of targetUsers
      // const testList = ['d396491c-22cf-4d63-af1e-4e70e95a29c7', '690a11a9-fad5-4e9d-8801-8d0dfaf9ab32'];
      const userData: User[] = await this.userService.getUsersFromCognito(targetUsers);

      companyUserList.push({ CompanyID: companyId, Users: userData });
    }

    // return company array
    return companyUserList;
  }

}

export type CompanyUsers = {"CompanyID": string, "Users": User[]};


