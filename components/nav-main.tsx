"use client"

import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    isNew?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup className="space-y-1 py-2">
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title} className="px-2">
            <SidebarMenuButton 
              asChild 
              className={`flex items-center gap-x-3 px-3 py-2 rounded-md ${item.isActive ? "bg-orange-50 text-orange-600" : "hover:bg-slate-100"}`}
            >
              <a href={item.url}>
                <item.icon className={item.isActive ? "text-orange-600" : "text-slate-600"} />
                <span className="flex-1">{item.title}</span>
                {item.isNew && (
                  <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                    New
                  </span>
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}