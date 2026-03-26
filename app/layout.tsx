import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dev-QC Workflow",
  description: "Internal Kanban Board",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
