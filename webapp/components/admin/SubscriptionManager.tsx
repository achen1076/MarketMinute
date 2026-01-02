"use client";

import { useState, useEffect } from "react";
import Card from "@/components/atoms/Card";

type User = {
  id: string;
  email: string | null;
  name: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
};

export default function SubscriptionManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/subscription");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (
    userId: string,
    currentTier: string | null
  ) => {
    const newTier = currentTier === "basic" ? "free" : "basic";
    setUpdating(userId);

    try {
      const res = await fetch("/api/admin/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscriptionTier: newTier }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
      }
    } catch (err) {
      console.error("Failed to update subscription:", err);
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Subscription Manager
      </h2>

      <input
        type="text"
        placeholder="Search by email or name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full mb-4 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading users...</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </p>
                {user.name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    user.subscriptionTier === "basic"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {user.subscriptionTier || "free"}
                </span>
                <button
                  onClick={() =>
                    toggleSubscription(user.id, user.subscriptionTier)
                  }
                  disabled={updating === user.id}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                    user.subscriptionTier === "basic"
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  }`}
                >
                  {updating === user.id
                    ? "..."
                    : user.subscriptionTier === "basic"
                    ? "Downgrade"
                    : "Upgrade"}
                </button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
