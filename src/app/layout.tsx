import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "ZARE - Premium Fashion & Essentials",
  description: "Experience the aura of premium shopping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <CartDrawer />
        <main>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </body>
    </html>
  );
}
