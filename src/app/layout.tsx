import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopFlight XI",
  description: "Draft an all-time XI from real historical squads and chase a perfect season.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950">{children}</body>
    </html>
  );
}
