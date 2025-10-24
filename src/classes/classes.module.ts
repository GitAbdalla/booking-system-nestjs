import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './class.entity';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Class])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [TypeOrmModule, ClassesService],
})
export class ClassesModule {}