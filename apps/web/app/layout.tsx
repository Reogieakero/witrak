import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ThemeProvider } from "@/app/components/theme-provider";
import { ThemeInit } from "@/app/components/theme-init";
import { SileoToaster } from "@/app/components/sileo-toaster";
import "sileo/styles.css";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FHUSOCOM",
  description: "Student Government Management System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <body>
        <ThemeInit />
        <ThemeProvider>{children}</ThemeProvider>
        <SileoToaster />
      </body>
    </html>
  );
}
