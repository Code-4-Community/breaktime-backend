import { Controller, Get , Headers} from '@nestjs/common';
import { AppService } from './app.service';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    console.log("Get hello endpoint has been hit "); 
    return this.appService.getHello();
  }

  @Get('login')
  getLogin(@Headers() headers): string {
    console.log("Request for login"); 
    console.log(headers); 
    return headers ; 
  }

}
