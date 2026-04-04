import React from "react";
import { Navbar } from "./Navbar";
import { AdBanner } from "@/components/AdBanner";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background font-sans">
      <AdBanner />
      <Navbar />
      <main className="flex-1 flex flex-col w-full">{children}</main>
    </div>
  );
}
