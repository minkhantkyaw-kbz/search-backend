import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AddData } from './app.interface';
import { FileInterceptor } from '@nestjs/platform-express/multer';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/heartbeat')
  heartbeat() {
    return this.appService.heartbeatFn();
  }

  @Delete('/delete')
  delete() {
    return this.appService.deleteCollection();
  }

  @Post('/add')
  add(@Body() data: AddData) {
    return this.appService.add(data);
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file, 'file');
    const fileBuffer = file.buffer;
    const mimeType = file.mimetype;
    const originalName = file.originalname;
    return await this.appService.uploadAndAdd({
      fileBuffer,
      mimeType,
      originalName,
    });
  }

  @Get('/search')
  search(@Query('query') query?: string) {
    return this.appService.search(query);
  }
}
