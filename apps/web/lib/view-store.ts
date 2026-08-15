"use client";

import type { ReactNode } from "react";

export type ViewSnapshot = {
  view: ReactNode;
  userName: string;
  roleLabel: string;
  isSuperAdmin: boolean;
};

export type PersistedViewData = {
  props: Record<string, unknown>;
  userName: string;
  roleLabel: string;
  isSuperAdmin: boolean;
};

const snapshots = new Map<string, ViewSnapshot>();

const STORAGE_PREFIX = "fhusocom:admin-view:";

export function saveViewSnapshot(pathname: string, snapshot: ViewSnapshot): void {
  snapshots.set(pathname, snapshot);
}

export function getViewSnapshot(pathname: string): ViewSnapshot | undefined {
  return snapshots.get(pathname);
}

export function savePersistedView(pathname: string, data: PersistedViewData): void {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + pathname, JSON.stringify(data));
  } catch {
    // Storage may be unavailable (private mode, quota). Ignore.
  }
}

export function getPersistedView(pathname: string): PersistedViewData | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + pathname);
    return raw ? (JSON.parse(raw) as PersistedViewData) : undefined;
  } catch {
    return undefined;
  }
}