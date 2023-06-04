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
        searchRoles
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
    return this.getAllUsersFromCognito();
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
    searchRoles: string[]
  ) {
    if (companyIds != undefined && companyIds.length > 0) {
      this.verifyAllowedCompanies(companyIds, user);
    } else {
      companyIds = (await GetCompaniesForUser(user.sub)).SupervisorCompanyIDs;
    }

    const companyUserList: CompanyUsers[] = [];
    for (const companyId of companyIds) {
      const companyUserData = await this.getCompanyUserData(
        companyId,
        searchRoles
      );
      companyUserList.push(companyUserData);
    }

    return companyUserList;
  }

  /**
   * TODO
   * @returns
   */
  async getAllUsersFromCognito(): Promise<UserModel[]> {
    const users = await this.cognitoService.getUsers();
    return users.map((user) => UserService.convertClientToModelUser(user));
  }

  /**
   * TODO
   * @param userIDs
   * @returns
   */
  async getUsersFromCognito(userIds: string[]): Promise<UserModel[]> {
    try {
      // TODO: this filtering might be better in the cognito service class, depending on if we expect to use the functionality elsewhere
      const users = await this.cognitoService.getUsers();
      return users
        .filter((user) => userIds.includes(user.Attributes["sub"]))
        .map((user) => UserService.convertClientToModelUser(user));
    } catch (err) {
      console.log(err);
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
      associateData = await this.getUsersFromCognito(companyData.AssociateIDs);
      companyUserData.Associates = associateData;
    }

    if (searchRoles.includes("supervisor")) {
      supervisorData = await this.getUsersFromCognito(
        companyData.SupervisorIDs
      );
      companyUserData.Supervisors = supervisorData;
    }
    return companyUserData;
  }

  /**
   * TODO
   * @param companyIds
   * @param user
   * @returns
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

// TODO: To have cleaner code above, we should switch to a class that can act as a filter for the Cognito user search,
// and we can build the search filter differently for different requirements and different requesters
class UserSearchFilter {
  private userIds: string[];
  private roles: CognitoRoles[];
  private basicUserInfo: boolean = false;
}

/**
 * Custom filter class
 */
class UserSearchFilterBuilder {}

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
