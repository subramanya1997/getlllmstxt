"use client"

import * as React from "react"
import {
  ListTree,
  Home,
  LayoutDashboard,
  Settings,
} from "lucide-react"
import Logo from "@/components/Logo"
import { usePathname } from "next/navigation"
import { useUser } from "@/lib/user-provider"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
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
  // {
  //   title: "Usage",
  //   url: "/dashboard/usage",
  //   icon: ChartSpline,
  // },
  // {
  //   title: "API Keys",
  //   url: "/dashboard/api-keys",
  //   icon: Key,
  // },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar: string
  }
}

export function AppSidebar({ user: propUser, ...props }: AppSidebarProps) {
  // Use client-side only rendering to avoid hydration mismatches
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()
  const { session } = useUser()
  
  // Create a default user object if none is provided
  const user = propUser || {
    name: session?.user?.email?.split("@")[0] || "User",
    email: session?.user?.email || "",
    avatar: session?.user?.email ? 
      `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.email}` : 
      "https://api.dicebear.com/7.x/initials/svg?seed=User",
  }

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // If not mounted yet, render a placeholder with the same structure
  // to avoid hydration mismatch during the first render
  if (!mounted) {
    return (
      <Sidebar 
        collapsible="none" 
        className="h-screen flex flex-col" 
        style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
        {...props}
      >
        <SidebarHeader>
          <div className="flex items-center justify-center p-2">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent 
          suppressHydrationWarning 
          className="flex-grow overflow-y-auto"
          style={{ flex: '1 1 auto', overflow: 'auto' }}
        >
          <NavMain
            items={navItems.map(item => ({
              ...item,
              isActive: false
            }))}
          />
        </SidebarContent>
        <SidebarFooter 
          className="mt-auto"
          style={{ marginTop: 'auto' }}
        >
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  }

  // Client-side only rendering after mounted
  const navItemsWithActive = navItems.map(item => ({
    ...item,
    isActive: 
      pathname === item.url || 
      (item.url !== "/dashboard" && pathname?.startsWith(item.url))
  }))

  return (
    <Sidebar 
      collapsible="none" 
      className="h-screen flex flex-col" 
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      {...props}
    >
      <SidebarHeader>
        <div className="flex items-center justify-center p-2">
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent 
        className="flex-grow overflow-y-auto"
        style={{ flex: '1 1 auto', overflow: 'auto' }}
      >
        <NavMain items={navItemsWithActive} />
      </SidebarContent>
      <SidebarFooter 
        className="mt-auto"
        style={{ marginTop: 'auto' }}
      >
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
