import { PartialType } from '@nestjs/mapped-types';
import { CallHistoryDto } from './create-call.dto';

export class UpdateCallDto extends PartialType(CallHistoryDto) {}
