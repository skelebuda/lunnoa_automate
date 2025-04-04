import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../../decorators/roles.decorator';
import { User } from '../../../decorators/user.decorator';
import { JwtUser } from '../../../types/jwt-user.type';

import { UpdateWorkspaceUserPreferencesDto } from './dto/update-workspace-user-preferences.dto';
import { WorkspaceUserPreferencesService } from './workspace-user-preferences.service';

@Controller('workspace-user-preferences')
@ApiTags('Workspace User Preferences')
@ApiBearerAuth()
export class WorkspaceUserPreferencesController {
  constructor(
    private readonly workspaceUserPreferencesService: WorkspaceUserPreferencesService,
  ) {}

  @Get('me')
  @Roles()
  findMe(@User() user: JwtUser) {
    return this.workspaceUserPreferencesService.findMe({
      workspaceUserId: user.workspaceUserId,
      throwNotFoundException: true,
    });
  }

  @Patch('me')
  @Roles()
  updateMe(
    @User() user: JwtUser,
    @Body() data: UpdateWorkspaceUserPreferencesDto,
  ) {
    return this.workspaceUserPreferencesService.updateMe({
      workspaceUserId: user.workspaceUserId,
      data,
    });
  }
}
