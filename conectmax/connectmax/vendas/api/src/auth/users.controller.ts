import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, UpdateUserDto } from './create-user.dto';
import { RequirePermissions } from './permissions.decorator';

@Controller('users')
@RequirePermissions('users:write')
export class UsersController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  @RequirePermissions('users:read', 'users:write')
  list() {
    return this.auth.listUsers();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.auth.createUser(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.auth.updateUser(id, dto);
  }
}
