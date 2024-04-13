import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('google-drive')
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Get('list-files')
  async listFiles() {
    return this.googleDriveService.listFiles();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileBuffer = file.buffer;
    const mimeType = file.mimetype;
    const originalName = file.originalname;
    return await this.googleDriveService.runOCR({
      fileBuffer,
      mimeType,
      originalName,
    });
  }
}
