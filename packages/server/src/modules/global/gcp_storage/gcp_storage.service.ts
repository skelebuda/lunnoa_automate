import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

import { ServerConfig } from '../../../config/server.config';

const env_prefix =
  ServerConfig.ENVIRONMENT === 'production' ? 'production/' : 'development/';

function createPath(...parts: string[]): string {
  if (parts.length === 0) return '/';
  let fullPath = parts[0];
  for (let i = 1; i < parts.length; i++) {
    if (!fullPath.endsWith('/')) fullPath += '/';
    fullPath += parts[i];
  }
  return fullPath;
}

@Injectable()
export class GCPStorageService {
  constructor() {
    const storage = new Storage({
      projectId: ServerConfig.GCP_STORAGE_PROJECT_ID,
      credentials: {
        client_email: ServerConfig.GCP_STORAGE_CLIENT_EMAIL,
        private_key: ServerConfig.GCP_STORAGE_PRIVATE_KEY,
      },
    });

    const bucket = storage.bucket(ServerConfig.GCP_STORAGE_BUCKET_ID);
  }

  #s3Client: Storage;

  #AWS_S3_BUCKET_ID = ServerConfig.S3_BUCKET_ID;

  public async getPresignedPostUrl({
    filePath,
    fileName,
    postOptions,
  }: {
    filePath: string;
    fileName: string;
    postOptions?: {
      ContentType?: string | null;
      ExpirationMinutes?: number;
      publicRead?: boolean;
    };
  }) {
    const file = this.#s3Client.bucket(this.#AWS_S3_BUCKET_ID).file(createPath(env_prefix, filePath));
    const options = {
      version: 'v4' as 'v4',
      action: 'write' as 'write',
      expires: Date.now() + 60 * (postOptions?.ExpirationMinutes ?? 1) * 1000,
      contentType: postOptions?.ContentType ?? getContentTypeFromFileName(fileName) ?? 'application/octet-stream',
    };

    const [url] = await file.getSignedUrl(options);

    return {
      presignedPostData: url,
      pathUrl: file.name,
    };
  }

  public async getPresignedPutUrl({
    filePath,
    fileName,
    putOptions,
  }: {
    filePath: string;
    fileName: string;
    putOptions?: {
      ContentType?: string | null;
      ExpirationMinutes?: number;
      publicRead?: boolean;
    };
  }) {
    const file = this.#s3Client.bucket(this.#AWS_S3_BUCKET_ID).file(createPath(env_prefix, filePath));
    const options = {
      version: 'v4' as 'v4',
      action: 'write' as 'write',
      expires: Date.now() + 60 * (putOptions?.ExpirationMinutes ?? 1) * 1000,
      contentType: putOptions?.ContentType ?? getContentTypeFromFileName(fileName) ?? 'application/octet-stream',
    };

    const [url] = await file.getSignedUrl(options);

    return {
      presignedUrl: url,
      pathUrl: file.name,
    };
  }

  public async getSignedRetrievalUrl(
    filePath: string,
    retrievalOptions?: { expiresInMinutes?: number },
  ) {
    const file = this.#s3Client.bucket(this.#AWS_S3_BUCKET_ID).file(createPath(env_prefix, filePath));
    const options = {
      version: 'v4' as 'v4',
      action: 'read' as 'read',
      expires: Date.now() + (retrievalOptions?.expiresInMinutes ?? 60) * 1000,
    };

    const [url] = await file.getSignedUrl(options);
    return url;
  }

  public async deleteFile(filePath: string) {
    const file = this.#s3Client.bucket(this.#AWS_S3_BUCKET_ID).file(createPath(env_prefix, filePath));
    await file.delete();
    return true;
  }

  public async deletePath(path: string) {
    const [files] = await this.#s3Client.bucket(this.#AWS_S3_BUCKET_ID).getFiles({ prefix: createPath(env_prefix, path) });
    await Promise.all(files.map(file => file.delete()));
  }

  public async uploadTextFile({
    textContent,
    filePath,
  }: {
    textContent: string;
    filePath: string;
  }) {
    const file = this.#s3Client.bucket(this.#AWS_S3_BUCKET_ID).file(createPath(env_prefix, filePath));
    await file.save(textContent);
    return true;
  }

  public async uploadBufferFile({
    buffer,
    filePath,
    fileName,
  }: {
    buffer: Buffer | ArrayBuffer;
    filePath: string;
    fileName: string;
  }) {
    const bufferToUpload = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
    const file = this.#s3Client.bucket(this.#AWS_S3_BUCKET_ID).file(createPath(env_prefix, filePath));
    await file.save(bufferToUpload, {
      contentType: getContentTypeFromFileName(fileName) ?? 'application/octet-stream',
    });
    return this.getSignedRetrievalUrl(filePath);
  }

  public async readTextFile({ filePath }: { filePath: string }) {
    const file = this.#s3Client.bucket(this.#AWS_S3_BUCKET_ID).file(createPath(env_prefix, filePath));
    const [contents] = await file.download();
    return contents.toString('utf-8');
  }

  public async deleteTempFiles(folderPath: string) {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [files] = await this.#s3Client.bucket(this.#AWS_S3_BUCKET_ID).getFiles({ prefix: createPath(env_prefix, folderPath) });
    const oldFiles = files.filter(file => file.metadata.updated && new Date(file.metadata.updated) < cutoffTime);

    await Promise.all(oldFiles.map(file => file.delete()));
  }

  private async streamToString(readable: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      readable.on('data', (chunk) => chunks.push(chunk));
      readable.on('end', () =>
        resolve(Buffer.concat(chunks).toString('utf-8')),
      );
      readable.on('error', reject);
    });
  }
}

function getContentTypeFromFileName(fileName: string): string | null {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  return fileExtension ? contentTypeMap[fileExtension] : null;
}

const contentTypeMap: { [key: string]: string } = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  xml: 'application/xml',
  svg: 'image/svg+xml',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  mpeg: 'video/mpeg',
  avi: 'video/x-msvideo',
  zip: 'application/zip',
  gzip: 'application/x-gzip',
  tar: 'application/x-tar',
  bz2: 'application/x-bzip2',
  csv: 'text/csv',
  rss: 'application/rss+xml',
  atom: 'application/atom+xml',
};
