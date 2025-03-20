"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true} className="h-screen overflow-hidden">
      <AppSidebar variant="floating" />
      <SidebarInset className="overflow-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
} 