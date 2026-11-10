import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password === adminPassword) {
      // Simple token (in production, use JWT or proper auth)
      const token = Buffer.from(`admin:${Date.now()}:${adminPassword}`).toString("base64");
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ success: false, message: "Password salah" }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

