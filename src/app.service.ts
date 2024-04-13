import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { v4 as uuidv4 } from 'uuid';
import { AddData } from './app.interface';
import { GoogleDriveService } from './google-drive/google-drive.service';

@Injectable()
export class AppService {
  constructor(
    private dbService: DatabaseService,
    private googleDriveService: GoogleDriveService,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  heartbeatFn() {
    return this.dbService.heartbeat();
  }

  async deleteCollection() {
    return await this.dbService.deleteCollection('test');
  }

  async add(data: AddData) {
    const collection = await this.dbService.getOrCreateCollection('test');
    const result = await collection.add({
      ids: [uuidv4()],
      documents: [data.text],
      metadatas: [
        {
          title: data.title,
          text: data.text,
        },
      ],
    });

    if (!result) {
      throw new Error('Failed to add document');
    }
    return { message: 'Document added.', data };
  }

  async search(query: string) {
    const collection = await this.dbService.getOrCreateCollection('test');
    const resp = await collection.query({
      nResults: 10,
      queryTexts: query,
    });
    return resp;
  }

  async uploadAndAdd({
    fileBuffer,
    mimeType,
    originalName,
  }: {
    fileBuffer: Buffer;
    mimeType: string;
    originalName: string;
  }) {
    const resp = await this.googleDriveService.runOCR({
      fileBuffer,
      mimeType,
      originalName,
    });

    await this.add({ title: resp.fileName, text: resp.textContent });
  }
}
