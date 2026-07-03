import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export const GRADIENTS = ['violet', 'sunset', 'ocean', 'lime', 'candy'] as const;

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsIn(GRADIENTS)
  gradient?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsIn(GRADIENTS)
  gradient?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
