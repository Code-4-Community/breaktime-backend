import {
  Controller,
  Get,
  Headers,
  UseGuards,
  Query,
  HttpStatus,
  Res,
  HttpException,
} from "@nestjs/common";
import { GetCompaniesForUser, GetCompanyData } from "../dynamodb";
import { Roles } from "src/utils/decorators/roles.decorators";
import TokenClient from "src/aws/cognito/cognito.keyparser";
import { RolesGuard } from "src/utils/guards/roles.guard";
import { UserService } from "./user.service";
import { User } from "./User.model";

@Controller("user")
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private userService: UserService) {}

  // TODO : For now, this primarily just works for supervisors, rather than admins. Some additional checks will need to be added for full admin support
  /**
   * Gets all the user data from a certain company/companies and returns and array. If no company ID is given,
   * we'll default to use the companies that the requesting user belongs to as the filter. If the user is an admin, return all users
   * unless a company ID is specified.
   *
   * @param companyID an optional filter query to get users only from this company, comma-delineated
   * @param roles an filter query to specify which users to get by roles (associate, supervisor, and/or admin); by default, will be only associates
   * @throws 401 UNAUTHORIZED if the companyID requested is not one that the user has access to
   * @returns an array of Company objects that contain the companyID and associated User data
   */
  @Get("users")
  @Roles("breaktime-admin", "breaktime-supervisor")
  public async getAllUsers(
    @Headers() headers: any,
    @Query("companyIds") companyIds?: string[],
    @Query("roles") roles: string[] = ["associate"]
  ): Promise<CompanyUsers[]> {
    // TODO : This needs to get user role data as well, or we need to find a way to grab it from the Roles guard to check if a user is an admin or supervisor
    const userId = await TokenClient.grabUserID(headers);
    console.log(userId);
    console.log(companyIds);

    if (!userId) {
      return [];
    }

    // the company IDs the user belongs to as a supervisor
    const userCompanyIds = (await GetCompaniesForUser(userId))
      .SupervisorCompanyIDs;

    // Get companyId(s) associated with user if no ids were provided via the queries
    if (companyIds === undefined || companyIds.length === 0) {
      companyIds = userCompanyIds;
    } else {
      // TODO: For later, we'll want to bypass this is a user is an admin
      // Throw an error if the user is not an admin and doesn't have access to one or more of the companyIDs specified
      for (const companyId of companyIds) {
        if (!userCompanyIds.includes(companyId)) {
          throw new HttpException(
            `User is not authorized to access company data for company ID ${companyId}`,
            HttpStatus.UNAUTHORIZED
          );
        }
      }
    }

    console.log(companyIds);

    const companyUserList: CompanyUsers[] = [];

    // get all users associated with companyId(s)
    for (const companyId of companyIds) {
      // This will be db call with companyIds as a filter on the query
      // This only gets the UserIDs, NOT all the user info
      const companyData = await GetCompanyData(companyId);

      let associateData = [];
      let supervisorData = [];
      let companyUserData: CompanyUsers = { CompanyID: companyId };

      if (roles.includes("associate")) {
        associateData = await this.userService.getUsersFromCognito(
          companyData.AssociateIDs
        );
        companyUserData.Associates = associateData;
      }

      if (roles.includes("supervisor")) {
        supervisorData = await this.userService.getUsersFromCognito(
          companyData.SupervisorIDs
        );
        companyUserData.Supervisors = supervisorData;
      }

      companyUserList.push(companyUserData);
    }

    // return company array
    return companyUserList;
  }
}

export type CompanyUsers = {
  CompanyID: string;
  Associates?: User[];
  Supervisors?: User[];
};
