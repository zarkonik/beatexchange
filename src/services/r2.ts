import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = import.meta.env.VITE_R2_BUCKET_NAME;

export const uploadToR2 = async (
  file: File,
  folder: string = "packs",
): Promise<string> => {
  const fileName = `${folder}/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
  const buffer = await file.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileName,
    Body: new Uint8Array(buffer),
    ContentType: file.type || "application/octet-stream",
  });

  await r2Client.send(command);

  // ✅ use public URL instead of S3 endpoint
  return `${import.meta.env.VITE_R2_PUBLIC_URL}/${fileName}`;
};
export const deleteFromR2 = async (fileUrl: string): Promise<void> => {
  // extract key from URL
  // URL looks like: https://pub-xxx.r2.dev/sample-packs/filename.rar
  const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;
  const key = fileUrl.replace(`${publicUrl}/`, "");

  const command = new DeleteObjectCommand({
    Bucket: import.meta.env.VITE_R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
};
