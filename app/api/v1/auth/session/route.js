import { verifyAuthSession } from "@/app/lib/session";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
  if (!session) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: session });
}
