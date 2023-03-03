import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from '../user/types/user.entity';
// import { UtilModule } from '../util/util.module';
// import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CognitoService } from './cognito/cognito.service';
import { CognitoWrapper } from './cognito/cognito.wrapper';

@Module({
  // imports: [TypeOrmModule.forFeature([User]), UtilModule],
  imports : [],
  providers: [AuthService, CognitoService, CognitoWrapper],
  // controllers: [AuthController],
  controllers: [AuthController],
  exports: [AuthService], 
})
export class AuthModule {}
