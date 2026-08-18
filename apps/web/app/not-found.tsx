import type { Metadata } from "next";
import { BrandError } from "@/app/components/brand-error";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <BrandError
      code="404"
      title="Page not found"
      message="The page you are looking for doesn't exist or may have been moved."
      primary={{ label: "Back to home", href: "/" }}
    />
  );
}