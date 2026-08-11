import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FHUSOCOM",
  description: "Student Government Management System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
