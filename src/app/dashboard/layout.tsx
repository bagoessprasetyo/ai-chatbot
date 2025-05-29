// src/app/dashboard/layout.tsx
'use client'

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  ChevronsUpDown, 
  Globe, 
  LayoutDashboard, 
  LogOut, 
  PieChart, 
  Settings, 
  User,
  Bot,
  BubblesIcon
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const sidebarVariants = {
  open: {
    width: "240px",
  },
  closed: {
    width: "60px",
  },
};

const contentVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0, display: "none" },
};

const transitionProps = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const mainLinks: SidebarLinkProps[] = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "Dashboard",
    },
    {
      href: "/dashboard/websites",
      icon: <Globe className="w-5 h-5" />,
      label: "Websites",
    },
    {
      href: "/dashboard/chatbots",
      icon: <Bot className="w-5 h-5" />,
      label: "Chatbots",
    },
    {
      href: "/dashboard/conversations",
      icon: <BubblesIcon className="w-5 h-5" />,
      label: "Conversations",
    },
    {
      href: "/dashboard/analytics",
      icon: <PieChart className="w-5 h-5" />,
      label: "Analytics",
    },
    {
      href: "/dashboard/settings",
      icon: <Settings className="w-5 h-5" />,
      label: "Settings",
    }
  ];

  return (
    <motion.div
      className="fixed left-0 z-40 h-full border-r sidebar shrink-0 bg-background"
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <div className="relative z-40 flex flex-col h-full shrink-0 bg-background text-foreground">
        {/* Header */}
        <div className="flex h-[60px] w-full shrink-0 items-center border-b p-2">
          <div className="flex items-center w-full gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <motion.div
              variants={contentVariants}
              animate={isCollapsed ? "closed" : "open"}
              className="text-lg font-semibold"
            >
              WebBot AI
            </motion.div>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex h-[60px] w-full shrink-0 items-center border-b p-2">
          <div className="mt-[1.5px] flex w-full">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full" asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center w-full gap-2 px-2"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                    <AvatarFallback>
                      {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div
                    variants={contentVariants}
                    className="flex items-center justify-between w-full"
                    animate={isCollapsed ? "closed" : "open"}
                  >
                    <div className="flex flex-col items-start text-left">
                      <p className="text-sm font-medium truncate">
                        {user?.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs truncate text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                    <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem asChild className="flex items-center gap-2">
                  <Link href="/dashboard/profile">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="flex items-center gap-2">
                  <Link href="/dashboard/settings">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="flex flex-col gap-1">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex h-10 items-center rounded-md px-2 py-2 transition-colors hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {link.icon}
                <motion.span
                  variants={contentVariants}
                  animate={isCollapsed ? "closed" : "open"}
                  className="ml-2 text-sm font-medium"
                >
                  {link.label}
                </motion.span>
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </motion.div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="flex flex-row w-screen h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex flex-col h-screen overflow-auto transition-all duration-300 grow" 
            style={{ marginLeft: '60px' }}>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}