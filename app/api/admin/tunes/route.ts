import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { cookies } from "next/headers";
import type { Manifest } from "@/app/radio/types";
import { getR2Client, R2_BUCKET } from "../../_lib/r2";

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("otr-admin")?.value === "authenticated";
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url: tuneUrl } = await request.json();
    const s3 = getR2Client();

    await s3.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: tuneUrl,
      })
    );

    const manifestResponse = await s3.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: "manifest.json",
      })
    );
    const body = await manifestResponse.Body?.transformToString();
    const manifest: Manifest = body ? JSON.parse(body) : [];

    const updated = manifest.filter((tune) => tune.url !== tuneUrl);

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: "manifest.json",
        Body: JSON.stringify(updated, null, 2),
        ContentType: "application/json",
      })
    );

    return Response.json({ success: true }, { status: 200 });
  } catch {
    return Response.json({ error: "Failed to delete tune" }, { status: 500 });
  }
}
