import { Module } from '@nestjs/common';
import { PkArenaController } from './pk-arena.controller';
import { PkArenaService } from './pk-arena.service';

@Module({
  controllers: [PkArenaController],
  providers: [PkArenaService],
})
export class PkArenaModule {}
