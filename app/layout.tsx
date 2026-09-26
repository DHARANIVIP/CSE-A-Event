import type { Metadata, Viewport } from "next";
import { Graduate, Pacifico, Courier_Prime, Caveat } from "next/font/google";
import "./theme.css";
import "./globals.css";
import { ClientLayout } from "@/components/ui/ClientLayout";
import { eventConfig } from "@/config/event.config";

const graduate = Graduate({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-graduate",
  fallback: ["Impact", "'Arial Narrow Bold'", "sans-serif"],
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pacifico",
  fallback: ["'Brush Script MT'", "cursive"],
});

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-courier-prime",
  fallback: ["'Courier New'", "monospace"],
});

const caveat = Caveat({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caveat",
  fallback: ["cursive"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_ORIGIN || "http://localhost:3000"),
  title: {
    template: `%s | ${eventConfig.eventName} – ${eventConfig.subtitle}`,
    default: `${eventConfig.eventName} – ${eventConfig.subtitle}`,
  },
  description: `${eventConfig.eventName}: An intensive digital forensics competition for 2nd-year CSE investigators. Crack the case, deduce the 5-character code, and unlock the mystery box.`,
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#B30033",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${graduate.variable} ${pacifico.variable} ${courierPrime.variable} ${caveat.variable}`}
    >
      <body className="antialiased min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
