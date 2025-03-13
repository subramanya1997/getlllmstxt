"use client"

import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  BookOpen,
  ChevronsUpDown,
  FileText,
  LogOut,
  LucideIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { supabaseClient } from "@/lib/supabase-client"
import { toast } from "@/hooks/use-toast"

// Define resource item type
export interface ResourceItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isExternal?: boolean;
}

// Default navigation configuration for documentation and blog
export const defaultResourceLinks: ResourceItem[] = [
  {
    title: "Blog",
    url: "/blogs",
    icon: FileText,
    isExternal: true
  },
  {
    title: "Documentation",
    url: "/docs",
    icon: BookOpen,
    isExternal: true
  }
];

export interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  resourceLinks?: ResourceItem[];
  showResources?: boolean;
}

export function NavUser({
  user,
  resourceLinks = defaultResourceLinks,
  showResources = true,
}: NavUserProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut()
      if (error) throw error
      
      router.push("/login")
      router.refresh()
    } catch {
      toast({
        title: "Error signing out",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const navigateTo = (url: string, isExternal: boolean = false) => {
    if (isExternal) {
      // For external links, open in a new tab
      window.open(url, '_blank');
    } else {
      // For internal links, use the Next.js router
      router.push(url);
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "top"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {showResources && resourceLinks.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {/* Resources navigation links */}
                <DropdownMenuGroup>
                  {resourceLinks.map((item) => (
                    <DropdownMenuItem 
                      key={item.title} 
                      onClick={() => navigateTo(item.url, item.isExternal)}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                      {item.isExternal && <ArrowUpRight className="ml-auto h-3 w-3 text-muted-foreground" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}