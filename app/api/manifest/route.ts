import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { cookies } from "next/headers";
import { getR2Client, R2_BUCKET } from "../_lib/r2";

export async function GET() {
  try {
    const s3 = getR2Client();
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: "manifest.json",
      })
    );

    const body = await response.Body?.transformToString();
    if (!body) {
      return Response.json([], { status: 200 });
    }

    return Response.json(JSON.parse(body), {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return Response.json(
      { error: "Failed to fetch manifest" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get("otr-admin")?.value !== "authenticated") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const manifest = await request.json();
    const s3 = getR2Client();

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: "manifest.json",
        Body: JSON.stringify(manifest, null, 2),
        ContentType: "application/json",
      })
    );

    return Response.json({ success: true }, { status: 200 });
  } catch {
    return Response.json(
      { error: "Failed to update manifest" },
      { status: 500 }
    );
  }
}
