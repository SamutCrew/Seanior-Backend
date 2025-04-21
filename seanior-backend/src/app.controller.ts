import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation,ApiTags } from '@nestjs/swagger';

@ApiTags('Test')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Test API' })
  @Get('test')
  getHello(): string {
    return this.appService.getHello();
  }
}
