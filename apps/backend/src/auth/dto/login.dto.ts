import { IsString, Length, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class MfaVerifyDto {
  @IsString()
  challengeToken!: string;

  @IsString()
  @Length(6, 32)
  code!: string;
}

export class MfaEnableDto {
  @IsString()
  setupToken!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
