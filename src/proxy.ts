import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPublicPath } from "@/lib/auth-routes";

/**
 * Next.js 16 Proxy (substituto de middleware.ts) com Auth.js.
 */
export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!request.auth;

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  if (!isPublicPath(pathname) && !isLoggedIn) {
    const loginUrl = new URL("/login", request.nextUrl);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$|banners|icones).*)",
  ],
};
