import { Injectable } from '@nestjs/common';
import { ChromaClient } from 'chromadb';
import { HuggingFaceEmbeddingFunction } from 'src/utils';

@Injectable()
export class DatabaseService {
  private client: ChromaClient;

  constructor() {
    this.init();
  }

  private init() {
    // Initialize ChromaClient
    this.client = new ChromaClient();
  }

  // heartbeat method for monitoring if chromadb is online
  async heartbeat() {
    return await this.client.heartbeat();
  }

  // Methods for interacting with the Chroma DB
  async getOrCreateCollection(name: string) {
    return await this.client.getOrCreateCollection({
      name,
      embeddingFunction: new HuggingFaceEmbeddingFunction(process.env.HF_TOKEN),
      // metadata: { 'hnsw:space': 'cosine' },
    });
  }

  async deleteCollection(name: string) {
    return await this.client.deleteCollection({ name });
  }
}

export const DatabaseProvider = {
  provide: 'VectorDb',
  useFactory: () => {
    return new DatabaseService();
  },
};
