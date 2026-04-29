import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: "Invalid password" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("otr-admin", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 4,
      path: "/",
    });

    return Response.json({ success: true }, { status: 200 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
