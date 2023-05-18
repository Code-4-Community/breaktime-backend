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

  async getUsers(
    user: ValidatedUser,
    companyIds: string[],
    searchRoles: string[]
  ): Promise<CompanyUsers[]> {
    const companyUserList: CompanyUsers[] = [];

    const userSearch = AUserSearch.createUserSearch(
      searchRoles,
      companyIds,
      user
    );

    userSearch.VerifyCompanies();
    userSearch.GetUsers();

    // Determine what primary role should be used when searching, i.e. what permissions should take precedence
    let primaryUserRole: CognitoRoles;
    if (user.groups.includes(CognitoRoles.ADMIN)) {
      primaryUserRole = CognitoRoles.ADMIN;
    } else if (user.groups.includes(CognitoRoles.SUPERVISOR)) {
      primaryUserRole = CognitoRoles.SUPERVISOR;
    } else if (user.groups.includes(CognitoRoles.ASSOCIATE)) {
      primaryUserRole = CognitoRoles.ASSOCIATE;
    } else {
      throw new HttpException(
        "No valid groups found for user",
        HttpStatus.UNAUTHORIZED
      );
    }

    // Determine companies to search for
    /*
    associates: should be able to get data for supervisors in their company and admins, but no one else
    supervisors: should be able to get data for admins and all users in their company
    admins: unrestricted
    */
    if (primaryUserRole != CognitoRoles.ADMIN) {
      if (companyIds === undefined || companyIds.length === 0) {
        if (primaryUserRole === CognitoRoles.SUPERVISOR) {
          companyIds = (await GetCompaniesForUser(user.sub))
            .SupervisorCompanyIDs;
        } else if (primaryUserRole === CognitoRoles.ASSOCIATE) {
          companyIds = (await GetCompaniesForUser(user.sub))
            .AssociateCompanyIDs;
        }
      } else {
        this.verifyAllowedCompanies(companyIds, user);
      }
    }

    // get all users associated with companyId(s)
    // If admin and companyIds is empty, get everything

    for (const companyId of companyIds) {
      const companyUserData = await this.getCompanyUserData(
        companyId,
        searchRoles
      );
      companyUserList.push(companyUserData);
    }

    // If admin data is requested
    if (searchRoles.includes("admin")) {
      
    }

    // return company array
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

export type CompanyUsers = {
  CompanyID: string;
  Associates?: UserModel[];
  Supervisors?: UserModel[];
};

// TODO: come up with a better name for this, maybe something like ScopedUserSearch
// This is a functional class that represents the different ways to process getting users
// for different roles (admin, supervisor, or associate)
abstract class AUserSearch {
  private _searchUserIds: string[];
  private _searchCompanyIds: string[];
  private _user: ValidatedUser;

  constructor(
    private searchUserIds: string[],
    private searchCompanyIds: string[],
    private user: ValidatedUser
  ) {
    this._searchUserIds = searchUserIds;
    this._searchCompanyIds = searchCompanyIds;
    this._user = user;
  }

  abstract UserDtoMapper(user: CognitoUser): UserModel;
  abstract VerifyCompanies();
  abstract GetUsers();

  // factory method to create the correct type of processing user
  static createUserSearch(
    searchUserIds: string[],
    searchCompanyIds: string[],
    user: ValidatedUser
  ): AUserSearch {
    if (user.groups.includes(CognitoRoles.ADMIN)) {
      return new AdminProcessingUser(searchUserIds, searchCompanyIds, user);
    } else if (user.groups.includes(CognitoRoles.SUPERVISOR)) {
      return new SupervisorProcessingUser(
        searchUserIds,
        searchCompanyIds,
        user
      );
    } else if (user.groups.includes(CognitoRoles.ASSOCIATE)) {
      return new AssociateProcessingUser(searchUserIds, searchCompanyIds, user);
    }
    throw error("No valid groups found for user.");
  }
}

class AdminProcessingUser extends AUserSearch {
  UserDtoMapper(user: {
    Attributes?: { Name?: string; Value?: string }[];
    Enabled?: boolean;
    UserCreateDate?: Date;
    UserLastModifiedDate?: Date;
    UserStatus?: string;
    Username?: string;
  }): UserModel {
    throw new Error("Method not implemented.");
  }
  VerifyCompanies() {
    throw new Error("Method not implemented.");
  }
  GetUsers() {
    throw new Error("Method not implemented.");
  }
}

class SupervisorProcessingUser extends AUserSearch {
  UserDtoMapper(user: {
    Attributes?: { Name?: string; Value?: string }[];
    Enabled?: boolean;
    UserCreateDate?: Date;
    UserLastModifiedDate?: Date;
    UserStatus?: string;
    Username?: string;
  }): UserModel {
    throw new Error("Method not implemented.");
  }
  VerifyCompanies() {
    throw new Error("Method not implemented.");
  }
  GetUsers() {
    throw new Error("Method not implemented.");
  }
}

class AssociateProcessingUser extends AUserSearch {
  UserDtoMapper(user: {
    Attributes?: { Name?: string; Value?: string }[];
    Enabled?: boolean;
    UserCreateDate?: Date;
    UserLastModifiedDate?: Date;
    UserStatus?: string;
    Username?: string;
  }): UserModel {
    throw new Error("Method not implemented.");
  }
  VerifyCompanies() {
    throw new Error("Method not implemented.");
  }
  GetUsers() {
    throw new Error("Method not implemented.");
  }
}
