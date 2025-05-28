import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AlertProvider } from "@/components/ui/alert-dialog-component";
import { Toaster } from "sonner";

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
        <AlertProvider>
          <SubscriptionProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                },
              }}
            />
          </SubscriptionProvider>
        </AlertProvider>
      </body>
    </html>
  );
}