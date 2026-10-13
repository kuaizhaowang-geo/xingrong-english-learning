import { IsString, IsBoolean, IsUUID, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export type PracticeType = 'recite' | 'spelling' | 'choice' | 'fill';

export const PRACTICE_TYPES: string[] = ['recite', 'spelling', 'choice', 'fill'];

export class UpdateWordRecordDto {
  @IsString()
  @IsUUID()
  wordId!: string;

  @IsBoolean()
  @Type(() => Boolean)
  isCorrect!: boolean;

  @IsOptional()
  @IsString()
  @IsIn(PRACTICE_TYPES)
  @Type(() => String)
  practiceType?: PracticeType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  usedHint?: boolean;
}
