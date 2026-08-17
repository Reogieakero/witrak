import { NextResponse } from "next/server";
import logoUrl from "../../public/logo-favicon.png";

export async function GET(request: Request) {
  return NextResponse.redirect(new URL(logoUrl.src, request.url), 301);
}