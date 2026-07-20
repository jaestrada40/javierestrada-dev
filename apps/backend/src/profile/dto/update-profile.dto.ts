import { IsEmail, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:\/[a-zA-Z0-9][a-zA-Z0-9._/-]*|https:\/\/[^\s]+)$/, {
    message: 'avatarUrl debe ser una ruta local segura o una URL HTTPS',
  })
  avatarUrl?: string;
}
