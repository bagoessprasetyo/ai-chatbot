import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "WebBot AI - Intelligent Chatbots for Your Website",
  description: "Create and deploy AI-powered chatbots for your website in minutes. Improve customer engagement with WebBot AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
      </body>
    </html>
  );
}