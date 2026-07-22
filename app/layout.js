import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import ScrollReveal from "./components/ScrollReveal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ShopSense - AI-Powered E-Commerce",
  description: "Dynamic pricing e-commerce platform with visual search",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <CartProvider>
            <Toaster position="top-right" toastOptions={{
              error: { duration: 4000 },
              success: { duration: 3000 },
            }} />
            <ServiceWorkerRegister />
            <ScrollReveal />
            {children}
          </CartProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
