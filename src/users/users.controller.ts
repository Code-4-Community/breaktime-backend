import {
  Controller,
  Get,
  Headers,
  UseGuards,
  Query,
  HttpStatus,
  Res,
  HttpException,
  Req,
} from "@nestjs/common";
import { GetCompaniesForUser, GetCompanyData } from "../dynamodb";
import { Roles } from "src/utils/decorators/roles.decorators";
import TokenClient from "src/aws/cognito/cognito.keyparser";
import { RolesGuard } from "src/utils/guards/roles.guard";
import { CompanyUsers, UserService } from "./user.service";
import { UserModel } from "./User.model";
import { ValidatedUser } from "src/aws/auth.service";
import { User } from "src/utils/decorators/user.decorator";
import { CognitoRoles } from "src/aws/cognito/Roles";

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
  public async getUsers(
    @Headers() headers: any,
    @User() user: ValidatedUser,
    @Query("companyIds") companyIds?: string[],
    @Query("roles") roles: string[] = ["associate"],
    @Query("userIds") userIds: string[] = []
  ): Promise<CompanyUsers[]> {
    if (!user.sub) {
      throw new HttpException(
        "No authorized user found",
        HttpStatus.UNAUTHORIZED
      );
    }

    return this.userService.getUsers(user, companyIds ?? [], roles, userIds);
  }

  @Get("usersById")
  public async getUsersByIds(
    @Headers() headers: any,
    @User() requester: ValidatedUser,
    @Query("userIds") userIds: string[] = []
  ): Promise<UserModel[]> {
    if (!requester.sub) {
      throw new HttpException(
        "No authorized user found",
        HttpStatus.UNAUTHORIZED
      );
    }

    return this.userService.getUsersByIds(requester, userIds);
  }
}
