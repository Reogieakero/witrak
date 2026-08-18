"use client";

import { useEffect } from "react";
import { BrandError } from "@/app/components/brand-error";

export default function ErrorPage({
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
    <BrandError
      code="500"
      title="This page couldn't load"
      message="A server error occurred. Reload to try again."
      primary={{ label: "Reload", onClick: () => retry() }}
      secondary={{ label: "Back to home", href: "/" }}
    />
  );
}