import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";

export const metadata: Metadata = {
  title: "StreamVault — Premium Video Streaming",
  description: "Exclusive premium video content. Pay once, watch forever.",
  openGraph: {
    title: "StreamVault",
    description: "Exclusive premium video content.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white min-h-screen">
        <NavbarWrapper />
        <main>{children}</main>
        <footer className="border-t border-border mt-20 py-10 text-center text-muted text-sm">
          <p>© {new Date().getFullYear()} StreamVault. All rights reserved.</p>
          <p className="mt-1 text-xs text-gray-600">
            Secure payments powered by Paystack
          </p>
        </footer>
      </body>
    </html>
  );
}
