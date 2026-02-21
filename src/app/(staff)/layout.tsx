"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Shield,
  Inbox,
  LayoutDashboard,
  FileSearch,
  Heart,
  BookOpen,
  Search,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  BarChart3,
  Users,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/staff", label: "Case Inbox", icon: Inbox },
  { href: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/evidence", label: "Evidence Viewer", icon: FileSearch },
  { href: "/staff/conditions", label: "Conditions", icon: Heart },
  { href: "/staff/vasrd", label: "VASRD Explorer", icon: BookOpen },
  { href: "/staff/gaps", label: "Gap Analyzer", icon: Search },
  { href: "/staff/packets", label: "Packet Builder", icon: Package },
  { href: "/staff/reports", label: "Reports", icon: BarChart3 },
];

const adminItems = [
  { href: "/admin", label: "Admin Console", icon: Settings },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/sites", label: "Sites & Teams", icon: Building2 },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("Loading...");
  const [userRole, setUserRole] = useState("");
  const [userInitials, setUserInitials] = useState("...");
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email || "Staff User";
        const role = user.user_metadata?.role || "caseworker";
        setUserName(name);
        setUserRole(role.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()));
        const parts = name.split(" ");
        setUserInitials(parts.map((p: string) => p[0]).join("").toUpperCase().slice(0, 2));
      }
    }
    loadUser();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex h-screen" style={{ background: "#080c12" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-200 lg:relative",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          background: "#0d1420",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Logo */}
        <div
          className="flex h-16 items-center gap-3 px-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #d4a843, #f0c958)" }}
          >
            <Shield className="h-5 w-5 text-black" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span
                className="text-sm font-bold tracking-[0.12em] uppercase"
                style={{ color: "#cdd5e0", fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                ClearClaim
              </span>
              <span
                className="text-[9px] tracking-[0.2em] uppercase"
                style={{ color: "#d4a843", fontFamily: "'IBM Plex Mono', monospace" }}
              >
                VSO Platform
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label="Staff navigation">
          {!collapsed && (
            <div
              className="px-2 mb-2 text-[9px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "rgba(205,213,224,0.35)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Casework
            </div>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/staff" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center"
                )}
                style={
                  isActive
                    ? {
                        background: "rgba(212,168,67,0.15)",
                        color: "#f0c958",
                        borderLeft: collapsed ? "none" : "2px solid #d4a843",
                      }
                    : {
                        color: "rgba(205,213,224,0.6)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "#cdd5e0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(205,213,224,0.6)";
                  }
                }}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {!collapsed && (
            <div
              className="px-2 mt-6 mb-2 text-[9px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "rgba(205,213,224,0.35)", fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Administration
            </div>
          )}
          {collapsed && (
            <div className="my-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
          )}
          {adminItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center"
                )}
                style={
                  isActive
                    ? {
                        background: "rgba(212,168,67,0.15)",
                        color: "#f0c958",
                      }
                    : {
                        color: "rgba(205,213,224,0.6)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "#cdd5e0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(205,213,224,0.6)";
                  }
                }}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Org info + collapse + sign out */}
        <div className="p-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {!collapsed && (
            <div className="rounded px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div
                className="text-[9px] uppercase tracking-[0.14em]"
                style={{ color: "rgba(205,213,224,0.35)", fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Organization
              </div>
              <div className="text-sm font-medium truncate" style={{ color: "#cdd5e0" }}>
                Texas Veterans Service Alliance
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSignOut}
              className={cn(
                "flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors",
                collapsed && "justify-center w-full"
              )}
              style={{ color: "rgba(205,213,224,0.45)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#cdd5e0";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(205,213,224,0.45)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center rounded p-2 transition-colors"
              style={{ color: "rgba(205,213,224,0.45)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#cdd5e0";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(205,213,224,0.45)";
                e.currentTarget.style.background = "transparent";
              }}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex h-14 items-center gap-4 px-4 lg:px-6"
          style={{
            background: "rgba(13,20,32,0.92)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded"
            style={{ color: "rgba(205,213,224,0.6)" }}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium" style={{ color: "#cdd5e0" }}>{userName}</div>
              <div
                className="text-[10px] uppercase tracking-[0.1em]"
                style={{ color: "rgba(205,213,224,0.45)", fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {userRole}
              </div>
            </div>
            <div
              className="h-9 w-9 rounded flex items-center justify-center text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #d4a843, #f0c958)",
                color: "#080c12",
              }}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" role="main" style={{ background: "#080c12" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
