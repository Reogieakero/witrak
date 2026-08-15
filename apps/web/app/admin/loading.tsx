"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import { AdminShell } from "@/app/components/admin-shell";
import { PageSkeleton } from "@/app/components/ui/page-skeleton";
import {
  getPersistedView,
  getViewSnapshot,
  type PersistedViewData,
} from "@/lib/view-store";
import { VIEW_REGISTRY } from "@/lib/view-registry";

type RestoredView = {
  Component: ComponentType<Record<string, unknown>>;
  data: PersistedViewData;
};

export default function Loading() {
  const pathname = usePathname();
  const [restored, setRestored] = useState<RestoredView | null>(null);

  useEffect(() => {
    const persisted = getPersistedView(pathname);
    const loader = persisted ? VIEW_REGISTRY[pathname] : undefined;
    if (!persisted || !loader) return;

    let cancelled = false;
    loader()
      .then((Component) => {
        if (!cancelled) setRestored({ Component, data: persisted });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

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

  if (restored) {
    const { Component, data } = restored;
    return (
      <AdminShell
        userName={data.userName}
        roleLabel={data.roleLabel}
        isSuperAdmin={data.isSuperAdmin}
        snapshot={false}
      >
        <Component {...data.props} />
      </AdminShell>
    );
  }

  return (
    <AdminShell userName="Loading" roleLabel="…" snapshot={false}>
      <PageSkeleton />
    </AdminShell>
  );
}