"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Veteran {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  branch_of_service: string;
}

const branchColors: Record<string, string> = {
  Army: "bg-green-100 text-green-700",
  Navy: "bg-blue-100 text-blue-700",
  "Air Force": "bg-sky-100 text-sky-700",
  "Marine Corps": "bg-red-100 text-red-700",
  "Coast Guard": "bg-orange-100 text-orange-700",
  "Space Force": "bg-purple-100 text-purple-700",
};

export default function VeteranPortalPage() {
  const router = useRouter();
  const [veterans, setVeterans] = useState<Veteran[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/veteran")
      .then((r) => r.json())
      .then((d) => setVeterans(d.veterans))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">ClearClaim</span>
              <span className="text-xs text-gray-500 block">Veteran Portal</span>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Login
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Your Veteran Portal</h1>
          <p className="text-gray-500 mt-2">
            Select your profile to view your case status, complete tasks, and upload documents.
          </p>
          <p className="text-xs text-gray-400 mt-1">Demo mode -- select any veteran to explore their view</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {veterans.map((vet) => (
              <button
                key={vet.id}
                onClick={() => router.push(`/veteran/${vet.id}`)}
                className="w-full flex items-center gap-4 rounded-xl border bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">
                    {vet.first_name} {vet.last_name}
                  </div>
                  <div className="text-sm text-gray-500">{vet.email}</div>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full",
                    branchColors[vet.branch_of_service] || "bg-gray-100 text-gray-600"
                  )}
                >
                  {vet.branch_of_service}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
