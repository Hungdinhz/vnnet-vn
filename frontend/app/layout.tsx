import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import CustomToaster from "@/components/CustomToaster";
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
          <CustomToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
