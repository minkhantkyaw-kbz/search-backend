// google-drive.service.ts

import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google, Auth, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file',
  ];
  private readonly TOKEN_PATH = path.join(process.cwd(), 'token.json');
  private readonly CREDENTIALS_PATH = path.join(
    process.cwd(),
    'credentials.json',
  );

  async loadSavedCredentialsIfExist(): Promise<Auth.OAuth2Client | null> {
    try {
      const content = await fs.readFile(this.TOKEN_PATH);
      const credentials = JSON.parse(content.toString());
      const { client_secret, client_id, refresh_token } = credentials;
      const oauth2Client = new google.auth.OAuth2(client_id, client_secret);
      oauth2Client.setCredentials({ refresh_token });
      return oauth2Client;
    } catch (err) {
      return null;
    }
  }

  async saveCredentials(client: Auth.OAuth2Client): Promise<void> {
    const content = await fs.readFile(this.CREDENTIALS_PATH);
    const keys = JSON.parse(content.toString());
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(this.TOKEN_PATH, payload);
  }

  async authorize(): Promise<Auth.OAuth2Client> {
    let client = await this.loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: this.SCOPES,
      keyfilePath: this.CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await this.saveCredentials(client);
    }
    return client;
  }

  async listFiles(): Promise<void> {
    const authClient = await this.authorize();
    const drive = google.drive({ version: 'v3', auth: authClient });
    const res = await drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name)',
    });
    const files = res.data.files;
    if (files.length === 0) {
      console.log('No files found.');
      return;
    }

    console.log('Files:');
    files.forEach((file) => {
      console.log(`${file.name} (${file.id})`);
    });
  }

  async runOCR({
    fileBuffer,
    mimeType,
    originalName,
  }: {
    fileBuffer: Buffer;
    mimeType: string;
    originalName: string;
  }): Promise<{ fileName: string; textContent: string }> {
    try {
      const authClient = await this.authorize();
      const drive = google.drive({ version: 'v3', auth: authClient });

      const fileId = await this.uploadFile(drive, fileBuffer, mimeType);
      const convertedFileId = await this.convertToGoogleDocs(drive, fileId);
      const ocrText = await this.extractTextFromGoogleDoc(
        drive,
        convertedFileId,
      );

      // // File path where you want to write the string
      // const filePath = path.join(process.cwd(), 'output.txt');

      // // Write the string to the file
      // fs.writeFile(filePath, ocrText);

      return { fileName: originalName, textContent: ocrText };
    } catch (err) {
      console.error('Error running OCR:', err);
      throw new Error('Failed to run OCR on files');
    }
  }

  async uploadFile(
    drive: drive_v3.Drive,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    try {
      const resp = await drive.files.create({
        // Request body metadata
        requestBody: {
          name: 'Sample file',
        },
        media: {
          mimeType: mimeType,
          body: Readable.from(fileBuffer),
        },
        fields: 'id',
      });

      return resp.data.id;
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  }

  private async convertToGoogleDocs(
    drive: drive_v3.Drive,
    fileId: string,
  ): Promise<string> {
    const params: drive_v3.Params$Resource$Files$Copy = {
      fileId,
      requestBody: {
        mimeType: 'application/vnd.google-apps.document',
      },
      fields: 'id',
    };

    const res = await drive.files.copy(params);

    await this.deleteFile(drive, fileId);

    return res.data.id;
  }

  private async extractTextFromGoogleDoc(
    drive: drive_v3.Drive,
    fileId: string,
  ): Promise<string> {
    const res = await drive.files.export({
      fileId,
      mimeType: 'text/plain',
    });

    await this.deleteFile(drive, fileId);

    return res.data as string;
  }

  private async deleteFile(
    drive: drive_v3.Drive,
    fileId: string,
  ): Promise<void> {
    await drive.files.delete({
      fileId,
    });

    console.log({ message: 'delete successfully' });
  }
}
