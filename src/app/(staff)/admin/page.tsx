"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Building2,
  Users,
  Shield,
  FileText,
  Clock,
  AlertTriangle,
  Search,
  Download,
  Key,
  Eye,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "audit" | "retention" | "ai">("overview");
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; entity_type: string; created_at: string; details: Record<string, unknown> }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setAuditLogs(data || []));
  }, []);

  const tabs = [
    { key: "overview", label: "Overview", icon: Settings },
    { key: "audit", label: "Audit Logs", icon: FileText },
    { key: "retention", label: "Retention Policy", icon: Trash2 },
    { key: "ai", label: "AI Monitoring", icon: Eye },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
          <p className="text-sm text-gray-500 mt-1">Organization management, compliance, and monitoring</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Org card */}
          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  TV
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Texas Veterans Service Alliance</h2>
                  <p className="text-sm text-gray-500">3 sites - 6 active cases - Pilot</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="mr-1 h-4 w-4" /> Edit
              </Button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <Building2 className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                <div className="text-2xl font-bold text-gray-900">3</div>
                <div className="text-xs text-gray-500">Sites</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <Users className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-xs text-gray-500">Staff Users</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <FileText className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                <div className="text-2xl font-bold text-gray-900">6</div>
                <div className="text-xs text-gray-500">Total Cases</div>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, label: "User Management", desc: "Add, edit, manage staff accounts and roles", href: "/admin/users" },
              { icon: Building2, label: "Sites & Teams", desc: "Manage office locations and team structure", href: "/admin/sites" },
              { icon: Shield, label: "Security Settings", desc: "MFA policy, session timeouts, access controls", href: "#" },
              { icon: Key, label: "RBAC Policies", desc: "Configure role-based access and permissions", href: "#" },
              { icon: FileText, label: "Template Library", desc: "Manage intake and packet templates", href: "#" },
              { icon: Clock, label: "SLA Configuration", desc: "Set deadlines and escalation rules", href: "#" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-xl border bg-white p-5 hover:border-blue-200 hover:shadow-sm transition-all group"
              >
                <item.icon className="h-6 w-6 text-gray-400 group-hover:text-blue-500 mb-3" />
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{item.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search audit logs..." className="pl-9" aria-label="Search audit logs" />
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export Logs
            </Button>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            {auditLogs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FileText className="mx-auto h-10 w-10 mb-3 text-gray-200" />
                <p>No audit logs recorded yet.</p>
                <p className="text-xs mt-1">Actions like exports, edits, and access events will appear here.</p>
              </div>
            ) : (
              <div className="divide-y">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-4">
                    <div className="text-sm flex-1">
                      <span className="font-medium text-gray-900">{log.action}</span>
                      <span className="text-gray-400"> on </span>
                      <span className="text-gray-600">{log.entity_type}</span>
                    </div>
                    <span className="text-xs text-gray-400">{log.created_at}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "retention" && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Data Retention Policy</h3>
            <div className="space-y-4">
              {[
                { label: "Case Data Retention", value: "7 years (2555 days)", desc: "How long case records are retained after closure" },
                { label: "Document Storage", value: "7 years after case closure", desc: "Uploaded documents and OCR results" },
                { label: "Audit Logs", value: "Indefinite", desc: "Compliance and security audit trail" },
                { label: "AI Processing Logs", value: "90 days", desc: "Prompts and outputs for QA purposes" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700">{item.value}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="font-semibold text-gray-900 mb-4">AI Monitoring Dashboard</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Extractions Today", value: "24" },
                { label: "Avg Confidence", value: "87%" },
                { label: "Low Confidence Flags", value: "3" },
                { label: "Human Overrides", value: "7" },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-gray-50 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{m.value}</div>
                  <div className="text-xs text-gray-500">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-yellow-800">AI Disclosure Notice</div>
                  <p className="text-sm text-yellow-700 mt-1">
                    All AI-generated content is clearly labeled as &quot;AI Draft&quot; in the platform. 
                    Staff must review and approve all AI outputs before they are included in case packets. 
                    This aligns with VA guidelines on responsible AI use.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
