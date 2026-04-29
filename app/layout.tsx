import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { PageTracker } from "@/components/page-tracker";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-context";
import { PremiumLoader } from "@/components/premium-loader";
import { PremiumFullscreenLoader } from "@/components/premium-fullscreen-loader";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AusDrive Premium Car Rental",
  description: "Premium Australia-only car rental landing page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <PremiumFullscreenLoader />
            <PremiumLoader />
            <PageTracker />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
