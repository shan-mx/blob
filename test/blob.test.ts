import { Blob } from "@/blob";

describe("Blob", () => {
  const blobBaseUrl = "http://base-url.com";
  const blob = new Blob({
    bucketName: process.env.BLOB_BUCKET_NAME!,
    baseUrl: blobBaseUrl,
    s3Config: {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      region: process.env.S3_REGION!,
    },
  });

  it("should upload a file and return the url", async () => {
    const url = await blob.upload({
      filePath: "test.txt",
      body: Buffer.from("test"),
    });

    expect(url.startsWith(blobBaseUrl)).toBe(true);
  });

  it("should check a file exists", async () => {
    const exists = await blob.exists({
      filePath: "test.txt",
    });

    expect(exists).toBe(true);
  });

  it("should download a file", async () => {
    const res = await blob.download({
      filePath: "test.txt",
    });

    expect(res).toBeInstanceOf(Buffer);
    expect(res.toString()).toBe("test");
  });

  it("should delete a file", async () => {
    await blob.delete({
      filePath: "test.txt",
    });

    const exists = await blob.exists({
      filePath: "test.txt",
    });

    expect(exists).toBe(false);
  });

  describe("auto fix file path", () => {
    it("should remove slashes at both ends", async () => {
      await blob.upload({
        filePath: "/test2.txt/",
        body: Buffer.from("test2"),
      });
    });

    it("should remove base url", async () => {
      await blob.delete({
        filePath: `${blobBaseUrl}/test2.txt`,
      });
      await expect(
        blob.download({
          filePath: "test2.txt",
        }),
      ).rejects.toThrow();
    });
  });
});
