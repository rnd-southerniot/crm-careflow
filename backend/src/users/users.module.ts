import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, RolesService],
  exports: [UsersService, RolesService],
})
export class UsersModule {}