"use client"

import * as React from "react"
import {
  ListTree,
  Home,
  LayoutDashboard,
  Settings,
} from "lucide-react"
import Logo from "@/components/logo"
import { usePathname } from "next/navigation"
import { useUser } from "@/lib/user-provider"

import { NavMain } from "@/components/navigation/nav-main"
import { NavUser } from "@/components/navigation/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

// Navigation items without isActive property
const navItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Playground",
    url: "/dashboard/playground",
    icon: LayoutDashboard,
  },
  {
    title: "Activity Logs",
    url: "/dashboard/activity-logs",
    icon: ListTree,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { session } = useUser()
  
  // Create a default user object
  const user = {
    name: session?.user?.email?.split("@")[0] || "User",
    email: session?.user?.email || "",
    avatar: session?.user?.email ? 
      `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.email}` : 
      "https://api.dicebear.com/7.x/initials/svg?seed=User",
  }

  // Add isActive to nav items
  const navItemsWithActive = navItems.map(item => ({
    ...item,
    isActive: 
      pathname === item.url || 
      (item.url !== "/dashboard" && pathname?.startsWith(item.url))
  }))

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center p-2">
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItemsWithActive} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
