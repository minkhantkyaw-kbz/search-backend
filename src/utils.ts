import { HfInference } from '@huggingface/inference';

export class HuggingFaceEmbeddingFunction {
  private apiKey: string;
  private huggingFaceApi: HfInference;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.huggingFaceApi = new HfInference(apiKey);
  }

  public async generate(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await this.huggingFaceApi.featureExtraction({
        model: 'BAAI/bge-m3',
        inputs: texts,
      });
      return embeddings as number[][];
    } catch (error) {
      throw error;
    }
  }
}
