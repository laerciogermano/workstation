import { Injectable, type PipeTransform } from '@nestjs/common';
import { AppError } from '../errors/app-error';
import { isUuid } from '../kernel/ids';

@Injectable()
export class UuidPipe implements PipeTransform<string, string> {
  transform(v: string): string {
    if (!isUuid(v)) throw new AppError('NOT_FOUND');
    return v;
  }
}
