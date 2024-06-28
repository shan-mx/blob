import type { S3ClientConfig } from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client as S3,
} from "@aws-sdk/client-s3";

/**
 * A class for managing files in an S3 bucket.
 */
export class Blob {
  protected client: S3;
  protected bucketName: string;
  protected baseUrl: string;

  /**
   * Creates a new Blob instance.
   *
   * @param config - The configuration for the Blob instance.
   * @param config.s3Config - The S3 client configuration.
   * @param config.bucketName - The name of the S3 bucket to use.
   * @param config.baseUrl - The base URL of the S3 bucket (optional).
   */
  constructor(config: {
    s3Config: S3ClientConfig;
    bucketName: string;
    baseUrl?: string;
  }) {
    this.client = new S3(config.s3Config);
    this.bucketName = config.bucketName;
    this.baseUrl = config.baseUrl ?? "";
  }

  /**
   * Uploads a file to the S3 bucket.
   *
   * @param params - The upload parameters.
   * @param params.filePath - The path where the file will be stored in the bucket. e.g. "images/my-image.jpg"
   * @param params.body - The file content as a Buffer.
   * @param params.contentEncoding - The content encoding of the file (optional). e.g. "base64"
   * @param params.contentType - The content type of the file (optional). e.g. "image/webp"
   * @returns The /path/to/file.ext or the base URL + /path/to/file.ext if the base URL is set.
   * @throws Error if there is an error uploading the file.
   */
  async upload(params: {
    filePath: string;
    body: Buffer;
    contentType?: string;
    contentEncoding?: string;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: this.tryFixFilePath(params.filePath),
      Body: params.body,
      ContentEncoding: params.contentEncoding,
      ContentType: params.contentType,
    });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `Error uploading file. Status code: ${response.$metadata.httpStatusCode}`,
      );
    }

    return `${this.baseUrl}/${params.filePath}`;
  }

  /**
   * Downloads a file from the specified file path in the S3 bucket.
   * @param params - The download parameters.
   * @param params.filePath - The path of the file to download.
   * @returns A buffer containing the downloaded file.
   * @throws Error if there is an error downloading the file.
   */
  async download(params: { filePath: string }): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: this.tryFixFilePath(params.filePath),
    });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `Error downloading file. Status code: ${response.$metadata.httpStatusCode}`,
      );
    }
    const stream = response.Body as Readable;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk as Buffer));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }

  /**
   * Deletes a file from the specified bucket.
   * @param params - The delete parameters.
   * @param params.filePath - The path of the file to delete.
   * @throws Error if there is an error deleting the file.
   */
  async delete(params: { filePath: string }): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: this.tryFixFilePath(params.filePath),
    });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 204) {
      throw new Error(
        `Error deleting file. Status code: ${response.$metadata.httpStatusCode}`,
      );
    }
  }

  /**
   * Checks if a file exists in the specified bucket.
   * @param params - The parameters for checking file existence.
   * @returns A Promise that resolves to a boolean indicating whether the file exists.
   */
  async exists(params: { filePath: string }): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: this.tryFixFilePath(params.filePath),
    });

    try {
      const response = await this.client.send(command);

      return response.$metadata.httpStatusCode === 200;
    } catch (error) {
      if (error instanceof Error && error.name === "NotFound") return false;
      throw error;
    }
  }

  /**
   * Removes leading and trailing slashes from the file path and removes the base URL if present.
   *
   * @param filePath - The file path to fix.
   * @returns The fixed file path.
   */
  protected tryFixFilePath(filePath: string): string {
    if (filePath.startsWith(this.baseUrl))
      filePath = filePath.slice(this.baseUrl.length);
    if (filePath.startsWith("/")) filePath = filePath.slice(1);
    if (filePath.endsWith("/")) filePath = filePath.slice(0, -1);

    return filePath;
  }
}
