import { Module } from '@nestjs/common';
import { DatabaseProvider, DatabaseService } from './database.service';

@Module({
  providers: [DatabaseService, DatabaseProvider],
  exports: [DatabaseService],
})
export class DatabaseModule {}
