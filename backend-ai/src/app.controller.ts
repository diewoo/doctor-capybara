import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): string {
    return 'OK';
  }

  @Get()
  getHello(): string {
    return 'Doctor Capybara API is running!';
  }
}
