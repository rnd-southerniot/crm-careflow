// apps/attendance/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSideCookie } from "./app/api/utils";

export async function proxy(request: NextRequest) {
  // const userData = await getServerSideCookie(String(process.env.NEXT_PUBLIC_USER_COOKIE));
  // console.log("attendance app middleware cookie: ", userData);

  // // If no user-data cookie, redirect to main-app with ?redirect=attendance
  // if (!userData) {
  //   console.log("User data not found, redirecting to main app");
  //   const mainAppUrl = new URL(String(process.env.NEXT_PUBLIC_MAIN_SITE_URL)); // Adjust for production
  //   // mainAppUrl.searchParams.set("redirect", "attendance");
  //   // return NextResponse.redirect(mainAppUrl);
  // }

  // Allow request to proceed if authenticated
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api).*)"] // Apply to all paths except Next.js internals
};
