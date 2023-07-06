import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UsersController } from "./users.controller";
import { CognitoService } from "src/aws/cognito/cognito.service";
import { CognitoWrapper } from "src/aws/cognito/cognito.wrapper";

@Module({
  imports: [],
  providers: [UserService, CognitoService, CognitoWrapper],
  controllers: [UsersController],
  exports: [UserService],
})
export class UserModule {}
