"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => signOut({ redirectTo: "/login" })}
    >
      <LogOut size={14} />
      Sign out
    </Button>
  );
}
