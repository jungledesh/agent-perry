import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { z } from 'zod';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(@Query('name') name: string) {
  const schema = z.string().min(1);
  const validated = schema.parse(name || 'World');
  return `Hello ${validated}!`;
}
}
