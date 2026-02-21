"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Site } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Settings, MapPin, Phone, Users } from "lucide-react";

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("sites")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setSites((data as Site[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites & Teams</h1>
          <p className="text-sm text-gray-500 mt-1">Manage office locations and team structure</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Site
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div key={site.id} className="rounded-xl border bg-white p-5 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{site.name}</h3>
                    <span className="text-xs text-gray-400 font-mono">{site.slug}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              {site.address && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{site.address}</span>
                </div>
              )}
              {site.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{site.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-3 pt-3 border-t">
                <Users className="h-4 w-4 text-gray-400" />
                <span>0 staff members</span>
                <Badge className="ml-auto text-xs bg-green-100 text-green-700">Active</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
