import "next-auth";
import "next-auth/jwt";
import type { UserAccess } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    access: UserAccess | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    access?: UserAccess | null;
  }
}
