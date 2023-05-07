import { Injectable } from "@nestjs/common";
import { CognitoUser } from "src/aws/cognito/User.client";
import { CognitoService } from "src/aws/cognito/cognito.service";
import { User } from "./User.model";
import { last } from "rxjs";

@Injectable()
export class UserService {
  constructor(
    private cognitoService: CognitoService,
  ) {}

  private async getAllUsers(): Promise<User[]> {
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

  private async getUsersFromCognito(userIDs: string[]): Promise<User[]> {
    try {
      const users = await this.cognitoService.getUsers(userIDs);

      // Parse out user data, map to the correct object here?
      for (const user of users) {
        console.log(user.Attributes);
      }

      return users.map(user => UserService.convertClientToModelUser(user));

    } catch (err) {
      console.log(err);
      return [];
    }
  }

  static convertClientToModelUser(user: CognitoUser) : User {
    var sub = user.Attributes.find(attribute => attribute.Name === 'sub');
    var email = user.Attributes.find(attribute => attribute.Name === 'email');
    var firstName = user.Attributes.find(attribute => attribute.Name === 'given_name');
    var lastName = user.Attributes.find(attribute => attribute.Name === 'family_name');

    // TODO : refactor into separate 'getAttribute' function so we don't repeat this code

    return { firstName: firstName != null ? firstName.Value : '' , 
            lastName: lastName != null ? lastName.Value : '', 
            userEmail: email != null ? email.Value : '', 
            userID: sub.Value };
  }
}