import { NextResponse } from "next/server";
import { verifyAuthSession } from "./app/lib/session";

const signInPath = {
  user: "/user",
  restaurant: "/restaurant",
  delivery: "/delivery",
};

function requiredAccountType(pathname) {
  if (pathname.startsWith("/user/")) return "user";
  if (pathname.startsWith("/restaurant/")) return "restaurant";
  if (pathname.startsWith("/delivery/")) return "delivery";
  if (pathname === "/place_order") return "user";
  return null;
}

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;
  const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
  const requiredType = requiredAccountType(pathname);

  if (requiredType && session?.type !== requiredType) {
    return NextResponse.redirect(new URL(signInPath[requiredType], request.url));
  }

  if (["user", "restaurant", "delivery"].includes(pathname.slice(1)) &&
      session?.type === pathname.slice(1)) {
    return NextResponse.redirect(new URL(`${pathname}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/restaurant/:path*", "/delivery/:path*", "/place_order"],
};
