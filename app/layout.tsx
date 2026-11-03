import type { Metadata, Viewport } from "next";
import "@fontsource-variable/geist";
import "./globals.css";

export const metadata: Metadata = {
  title: "the routine. — show up. every day.",
  description: "A quiet space for your daily discipline. Small steps, repeated every day.",
  applicationName: "The Routine",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0D0D0D", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
