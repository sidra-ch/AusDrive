"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, PageWrapper, PrimaryBtn, SectionHeader } from "@/components/dashboard/ui";
import { AlertCircle, Lock, Mail, User, Briefcase } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "ACCOUNTANT"]),
  branch: z.string().min(1, "Branch required"),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function UsersNewPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "STAFF", branch: "Sydney", is_active: true },
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/dashboard/users");
    } else {
      alert("Error creating user");
    }
  }

  const branches = ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Hobart", "Darwin"];

  return (
    <PageWrapper>
      <SectionHeader title="Create User" subtitle="Add a new team member" />
      <Card className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground/70">
              <User className="h-4 w-4 text-cyan-400" /> Full Name
            </label>
            <input
              {...register("name")}
              placeholder="John Smith"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40 focus:bg-white/5"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground/70">
              <Mail className="h-4 w-4 text-cyan-400" /> Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="user@ausdrive.com"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40 focus:bg-white/5"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground/70">
              <Lock className="h-4 w-4 text-cyan-400" /> Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40 focus:bg-white/5"
            />
            {errors.password && <p className="mt-1 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.password.message}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Role</label>
            <select
              {...register("role")}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40 focus:bg-white/5"
            >
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.role.message}</p>}
          </div>

          {/* Branch */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground/70">
              <Briefcase className="h-4 w-4 text-cyan-400" /> Branch
            </label>
            <select
              {...register("branch")}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-500/40 focus:bg-white/5"
            >
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            {errors.branch && <p className="mt-1 text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.branch.message}</p>}
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register("is_active")}
              className="h-4 w-4 rounded border border-cyan-500/40 bg-cyan-500/10 accent-cyan-400"
            />
            <label className="text-sm font-medium text-foreground/70">Activate immediately</label>
          </div>

          {/* Submit */}
          <PrimaryBtn type="submit" className="w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </PrimaryBtn>
        </form>
      </Card>
    </PageWrapper>
  );
}
