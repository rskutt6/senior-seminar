import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import * as usersService_1 from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: usersService_1.UsersService) {}

  @Post()
  create(@Body() dto: usersService_1.CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }
}
