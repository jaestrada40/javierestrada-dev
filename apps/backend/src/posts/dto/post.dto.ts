import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  excerpt!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
