import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  get(): Promise<Profile> {
    return this.profileService.get();
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  update(@Body() dto: UpdateProfileDto): Promise<Profile> {
    return this.profileService.update(dto);
  }
}
