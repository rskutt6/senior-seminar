import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import type { CreateUserDto } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() body: CreateUserDto) {
    try {
      return await this.usersService.create(body);
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new BadRequestException('Email already exists.');
      }
      throw new BadRequestException(e?.message ?? 'Could not create user.');
    }
  }
}
