import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {run} from "../test/UploadTimesheet" 

async function bootstrap() {
  // UPLOAD mode to allow us to run arbitrary upload commands 
  console.log("Starting"); 
  if (process.env.ENV_TYPE == "UPLOAD") {
    run(); 
  } else {
    const app = await NestFactory.create(AppModule);
    await app.listen(3050);
  }
} 
bootstrap();
