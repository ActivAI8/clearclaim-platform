"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const demoUsers = [
  { id: "1", name: "Jane Smith", email: "jane.smith@tvsa.org", role: "supervisor", site: "Houston", active: true },
  { id: "2", name: "Mike Johnson", email: "mike.j@tvsa.org", role: "caseworker", site: "Houston", active: true },
  { id: "3", name: "Lisa Chen", email: "lisa.chen@tvsa.org", role: "caseworker", site: "Dallas", active: true },
  { id: "4", name: "Tom Davis", email: "tom.davis@tvsa.org", role: "intake_coordinator", site: "Dallas", active: true },
  { id: "5", name: "Sarah Wilson", email: "sarah.w@tvsa.org", role: "qa_reviewer", site: "San Antonio", active: false },
  { id: "6", name: "Admin User", email: "admin@tvsa.org", role: "org_admin", site: "All Sites", active: true },
];

const roleColors: Record<string, string> = {
  org_admin: "bg-purple-100 text-purple-700",
  site_admin: "bg-blue-100 text-blue-700",
  supervisor: "bg-indigo-100 text-indigo-700",
  caseworker: "bg-green-100 text-green-700",
  intake_coordinator: "bg-cyan-100 text-cyan-700",
  qa_reviewer: "bg-orange-100 text-orange-700",
};

export default function UserManagementPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff accounts, roles, and permissions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search users..." className="pl-9" aria-label="Search users" />
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">User</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Role</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Site</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {demoUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge className={cn("text-xs", roleColors[user.role] || "bg-gray-100 text-gray-600")}>
                    {user.role.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="p-4 text-sm text-gray-600">{user.site}</td>
                <td className="p-4">
                  <Badge className={cn("text-xs", user.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                    {user.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
