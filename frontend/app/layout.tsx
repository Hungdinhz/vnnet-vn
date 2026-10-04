import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from "@/components/ThemeProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "VnNet — Mạng xã hội",
  description: "VnNet - Mạng xã hội Việt Nam. Kết nối, chia sẻ, trò chơi và nhiều hơn nữa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1a1030',
              color: '#F0E6FF',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            },
          }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
