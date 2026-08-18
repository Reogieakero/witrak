"use client";

import { useEffect } from "react";
import "./globals.css";
import { BrandError } from "@/app/components/brand-error";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <BrandError
          code="500"
          title="This page couldn't load"
          message="A server error occurred. Reload to try again."
          primary={{ label: "Reload", onClick: () => retry() }}
          secondary={{ label: "Back to home", href: "/" }}
        />
      </body>
    </html>
  );
}