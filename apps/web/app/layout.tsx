import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/app/components/theme-provider";
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
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="fh-com-theme";var t=localStorage.getItem(k);if(t==="system"||!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <SileoToaster />
      </body>
    </html>
  );
}
