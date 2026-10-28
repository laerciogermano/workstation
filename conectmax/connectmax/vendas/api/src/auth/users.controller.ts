import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AuthPrincipal } from './auth-user';
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

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: { user?: AuthPrincipal },
  ) {
    return this.auth.deleteUser(id, req.user?.sub);
  }
}
