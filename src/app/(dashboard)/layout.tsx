import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { DashboardProvider } from "@/context/dashboard-context";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return (
    <DashboardProvider>
      <div className="min-h-screen bg-[#F8F9FA] flex w-full">
        {/* Sidebar (Desktop retrátil + Mobile drawer) */}
        <Sidebar />

        {/* Área Central de Conteúdo */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
