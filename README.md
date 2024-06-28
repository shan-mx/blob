# Blob

Thin wrapper around S3 Client for easier file actions.

## Installation

```bash
npx jsr add @mxkit/blob
```

```bash
pnpm dlx jsr add @mxkit/blob
```

```bash
bunx jsr add @mxkit/blob
```

## Usage

```typescript
import { Blob } from "@mxkit/blob";

// Initialize the Blob instance
const blob = new Blob({
  bucketName: process.env.BLOB_BUCKET_NAME,
  baseUrl: "http://your-blob-url.com",
  s3Config: {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.S3_REGION,
  },
});

// Upload a file
const uploadUrl = await blob.upload({
  filePath: "test.txt",
  body: Buffer.from("test"),
});
console.log("Uploaded file URL:", uploadUrl);

// Check if a file exists
const fileExists = await blob.exists({
  filePath: "test.txt",
});
console.log("File exists:", fileExists);

// Download a file
const downloadedContent = await blob.download({
  filePath: "test.txt",
});
console.log("Downloaded content:", downloadedContent.toString());

// Delete a file
await blob.delete({
  filePath: "test.txt",
});

// The Blob instance automatically handles file path formatting:
// - Removes slashes at both ends of the file path
// - Removes the base URL if it's included in the file path
await blob.upload({
  filePath: "/test2.txt/",
  body: Buffer.from("test2"),
});

await blob.delete({
  filePath: "http://your-blob-url.com/test2.txt",
});
```
