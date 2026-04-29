"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Badge, PageWrapper, PrimaryBtn, SectionHeader, Table, Td, Th } from "@/components/dashboard/ui";
import { Plus } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

const roleVariant: Record<string, "info" | "success" | "warning" | "neutral"> = {
  SUPER_ADMIN: "info", ADMIN: "info", MANAGER: "success", STAFF: "neutral", ACCOUNTANT: "warning",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <PageWrapper>
      <SectionHeader
        title="Staff & Users"
        subtitle="Role-based access control"
        action={<PrimaryBtn><Plus className="h-4 w-4" /> Add User</PrimaryBtn>}
      />
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading users...</div>
      ) : (
        <Table>
          <thead>
            <tr><Th>User</Th><Th>Role</Th><Th>Branch</Th><Th>Last Login</Th><Th>Status</Th></tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-white/3 transition">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-xs font-bold text-white flex-none">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td><Badge label={u.role} variant={roleVariant[u.role] ?? "neutral"} /></Td>
                <Td>{u.branch}</Td>
                <Td className="text-muted-foreground text-xs">
                  {u.last_login ? format(new Date(u.last_login), "MMM d, h:mm a") : "Never"}
                </Td>
                <Td><Badge label={u.is_active ? "active" : "inactive"} variant={u.is_active ? "success" : "neutral"} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}
