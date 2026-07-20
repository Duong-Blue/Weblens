import { IsBoolean, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateAuditDto {
  @IsString()
  @MinLength(1)
  url: string;

  @IsBoolean()
  @IsOptional()
  anonymous?: boolean;
}
