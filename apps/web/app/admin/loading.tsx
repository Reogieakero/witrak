"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "@/app/components/admin-shell";
import { PageSkeleton } from "@/app/components/ui/page-skeleton";
import { getViewSnapshot } from "@/lib/view-store";

export default function Loading() {
  const pathname = usePathname();

  // Show the previous in-memory snapshot of THIS page for instant back-nav.
  // Deliberately no sessionStorage restore here: rehydrating stale serialized
  // props flashes outdated data (often the wrong page's content) and parsing
  // large payloads (e.g. sanctions) janks navigation. Unknown pages fall
  // through to a neutral skeleton with the full sidebar (see AdminShell
  // isNavLoading) instead of a Dashboard-only glitch.
  const memory = getViewSnapshot(pathname);

  if (memory) {
    return (
      <AdminShell
        userName={memory.userName}
        roleLabel={memory.roleLabel}
        isSuperAdmin={memory.isSuperAdmin}
        snapshot={false}
      >
        {memory.view}
      </AdminShell>
    );
  }

  return (
    <AdminShell userName="Loading" roleLabel="…" snapshot={false}>
      <PageSkeleton />
    </AdminShell>
  );
}
