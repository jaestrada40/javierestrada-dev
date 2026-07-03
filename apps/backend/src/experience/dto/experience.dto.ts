import { IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateExperienceDto {
  @IsIn(['work', 'education'])
  kind!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  organization!: string;

  @IsInt()
  startYear!: number;

  @IsOptional()
  @IsInt()
  endYear?: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateExperienceDto {
  @IsOptional()
  @IsIn(['work', 'education'])
  kind?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  organization?: string;

  @IsOptional()
  @IsInt()
  startYear?: number;

  @IsOptional()
  @IsInt()
  endYear?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
