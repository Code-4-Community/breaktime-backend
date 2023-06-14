import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CognitoUser } from "src/aws/cognito/User.client";
import { CognitoService } from "src/aws/cognito/cognito.service";
import { UserModel } from "./User.model";
import { combineAll, last } from "rxjs";
import { ValidatedUser } from "src/aws/auth.service";
import { GetCompaniesForUser, GetCompanyData } from "src/dynamodb";
import { CognitoRoles } from "src/aws/cognito/Roles";
import { error } from "console";

// TODO : create a custom filter class instead of this that for each user
@Injectable()
export class UserService {
  constructor(private cognitoService: CognitoService) {}

  /*
    associates: should be able to get data for supervisors in their company and admins, but no one else
    supervisors: should be able to get data for admins and all users in their company
    admins: unrestricted
  */
  async getUsers(
    user: ValidatedUser,
    companyIds: string[],
    searchRoles: string[],
    userIds: string[]
  ): Promise<CompanyUsers[]> {
    // Determine what primary role should be used when searching, i.e. what permissions should take precedence
    let companyUserList: CompanyUsers[];
    if (user.groups.includes(CognitoRoles.ADMIN)) {
      // TODO: return this.getUsersForAdmin();
    } else if (user.groups.includes(CognitoRoles.SUPERVISOR)) {
      companyUserList = await this.getUsersForSupervisor(
        user,
        companyIds,
        searchRoles,
        userIds
      );
    } else if (user.groups.includes(CognitoRoles.ASSOCIATE)) {
      companyUserList = await this.getUsersForAssociate(
        user,
        companyIds,
        searchRoles
      );
    } else {
      throw new HttpException(
        "No valid groups found for user",
        HttpStatus.UNAUTHORIZED
      );
    }
    return companyUserList;
  }

  // TODO: this will need to do mapping to company data
  async getUsersForAdmin() {
    return this.getAllUsers();
  }

  async getUsersForAssociate(
    user: ValidatedUser,
    companyIds: string[],
    searchRoles: string[]
  ) {
    if (companyIds != undefined && companyIds.length > 0) {
      this.verifyAllowedCompanies(companyIds, user);
    } else {
      companyIds = (await GetCompaniesForUser(user.sub)).AssociateCompanyIDs;
    }

    const companyUserList: CompanyUsers[] = [];
    for (const companyId of companyIds) {
      const companyUserData = await this.getCompanyUserData(
        companyId,
        searchRoles
      );
      companyUserList.push(companyUserData);
    }

    // TODO : We may want to return a 'basic' version of the user data available to associates, like not returning fields such
    // as email address, etc.

    return companyUserList;
  }

  async getUsersForSupervisor(
    user: ValidatedUser,
    companyIds: string[],
    searchRoles: string[],
    userIds: string[]
  ) {
    if (companyIds != undefined && companyIds.length > 0) {
      this.verifyAllowedCompanies(companyIds, user);
    } else {
      companyIds = (await GetCompaniesForUser(user.sub)).SupervisorCompanyIDs;
    }
    // Schema for return object:

    /*
    {
    Admins: ["userId1', "userId2"...],
    CompanyUserData: [CompanyId: { Associates: [ "userId3, "userId1"], Supervisors: ["userId4"] }, ... ]
    Users:
    [ {userId: userObject} ]
    }
    */
    const companyUserList: CompanyUsers[] = [];
    for (const companyId of companyIds) {
      const companyUserData = await this.getCompanyUserData(
        companyId,
        searchRoles
      );
      companyUserList.push(companyUserData);
    }

    // TODO: getAllAdmins

    return companyUserList;
  }

  async getUsersByIds(
    requester: ValidatedUser,
    userIds: string[]
  ): Promise<UserModel[]> {
    // get all cognito data for users
    const cognitoUsers = await this.getCognitoUsersByIds(userIds);
    console.log(cognitoUsers);

    // validate that the requested user is either an admin, or that all userids are in their company/are admins
    // TODO

    // get the company data for all users, and merge it into the existing cognito data
    for (const user of cognitoUsers) {
      await this.updateUserWithCompanyData(user);
    }

    return cognitoUsers;
  }

  /**
   * Updates the given user object with any company ids they belong to. If the user doesn't belong to any companies,
   * defaults their company id attributes to empty lists.
   */
  private async updateUserWithCompanyData(user: UserModel) {
    try {
      // try to find user company data if it exists
      const userCompanyData = await GetCompaniesForUser(user.userID);
      user.associateCompanyIds = userCompanyData.AssociateCompanyIDs;
      user.supervisorCompanyIds = userCompanyData.SupervisorCompanyIDs;
    } catch (error) {
      console.log("Issue retrieving company data for user " + user.userID);
      user.associateCompanyIds = [];
      user.supervisorCompanyIds = [];
    }
  }

  /**
   * Returns a list of all user data from Cognito user pool.
   */
  async getAllUsers(): Promise<UserModel[]> {
    const users = await this.cognitoService.getUsers();
    return users.map((user) => UserService.convertClientToModelUser(user));
  }

  async getAllAdmins(): Promise<UserModel[]> {
    // TODO : add to cognito service something that calls ListUsersInGroup
    return [];
  }

  /**
   * Returns a list of user data from Cognito user pool, searching only for the given list of user ids.
   */
  private async getCognitoUsersByIds(userIds: string[]): Promise<UserModel[]> {
    try {
      const users = await this.cognitoService.getUsers(userIds);
      return users.map((user) => UserService.convertClientToModelUser(user));
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  /**
   * Gets a list of all users, both associates and supervisors, at a given company.
   * @param companyId
   * @returns
   */
  async getUsersInCompany(companyId: string): Promise<String[]> {
    try {
      const companyData = await GetCompanyData(companyId);
      if (companyData == null) {
        return [];
      }
      return companyData.AssociateIDs.concat(companyData.SupervisorIDs);
    } catch {
      return [];
    }
  }

  /**
   * TODO
   * @param companyId
   * @param searchRoles
   * @returns
   */
  async getCompanyUserData(
    companyId: string,
    searchRoles: string[]
  ): Promise<CompanyUsers> {
    // This will be db call with companyIds as a filter on the query
    // This only gets the UserIDs, NOT all the user info
    const companyData = await GetCompanyData(companyId);

    let associateData = [];
    let supervisorData = [];
    let companyUserData: CompanyUsers = { CompanyID: companyId };

    if (searchRoles.includes("associate")) {
      associateData = await this.getCognitoUsersByIds(companyData.AssociateIDs);
      companyUserData.Associates = associateData;
    }

    if (searchRoles.includes("supervisor")) {
      supervisorData = await this.getCognitoUsersByIds(
        companyData.SupervisorIDs
      );
      companyUserData.Supervisors = supervisorData;
    }
    return companyUserData;
  }

  /**
   * Verify that the given user can access the company user data for the list of company IDs. This means they are either:
   * - an admin user
   * - an associate or supervisor user who belongs to the companies requested, as per records in Dynamo
   * @param companyIds the list of company IDs to verify access to
   * @param user the user who made the request
   * @throws 401 Unauthorized if the user attempts to access company user data that they don't have access to.
   */
  private async verifyAllowedCompanies(
    companyIds: string[],
    user: ValidatedUser
  ) {
    // Admins have access to all companies
    if (user.groups.includes(CognitoRoles.ADMIN)) {
      return;
    }

    const allowedCompanies = user.groups.includes(CognitoRoles.SUPERVISOR)
      ? (await GetCompaniesForUser(user.sub)).SupervisorCompanyIDs
      : (await GetCompaniesForUser(user.sub)).AssociateCompanyIDs;

    // Throw an error if the user is not an admin and doesn't have access to one or more of the companyIDs specified
    for (const companyId of companyIds) {
      if (!allowedCompanies.includes(companyId)) {
        throw new HttpException(
          `User is not authorized to access company data for company ID ${companyId}`,
          HttpStatus.UNAUTHORIZED
        );
      }
    }
  }

  /**
   * TODO
   * @param user
   * @returns
   */
  static convertClientToModelUser(user: CognitoUser): UserModel {
    var sub = user.Attributes.find((attribute) => attribute.Name === "sub");
    var email = user.Attributes.find((attribute) => attribute.Name === "email");
    var firstName = user.Attributes.find(
      (attribute) => attribute.Name === "given_name"
    );
    var lastName = user.Attributes.find(
      (attribute) => attribute.Name === "family_name"
    );

    // TODO : refactor into separate 'getAttribute' function so we don't repeat this code

    return {
      firstName: firstName != null ? firstName.Value : "",
      lastName: lastName != null ? lastName.Value : "",
      userEmail: email != null ? email.Value : "",
      userID: sub.Value,
    };
  }
}

export type CompanyUsers = {
  CompanyID: string;
  Associates?: UserModel[];
  Supervisors?: UserModel[];
};

/**
 * Represents the
 */
export type UserSearchData = {
  user: ValidatedUser;
  companyIds?: string[];
  searchRoles?: string[];
  userIds?: string[];
};
