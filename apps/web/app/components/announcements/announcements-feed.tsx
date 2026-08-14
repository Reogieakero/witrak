"use client";

import { Megaphone, ChevronRight, Search } from "lucide-react";
import { Pagination } from "@/app/components/ui/pagination";
import { SearchInput } from "@/app/components/ui/search-input";
import type { AnnouncementsFeedProps, AnnouncementItem } from "./types";
import styles from "./announcements-feed.module.css";

const PAGE_SIZE = 5;

function Empty({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <span className={styles.emptyTitle}>{title}</span>
      <span className={styles.emptySub}>{sub}</span>
    </div>
  );
}

function AnnouncementCard({
  item,
  onView,
}: {
  item: AnnouncementItem;
  onView: (id: string) => void;
}) {
  const open = () => onView(item.id);

  return (
    <div
      className={styles.item}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className={styles.itemHead}>
        <div className={styles.itemTitleWrap}>
          <div className={styles.titleRow}>
            <h3 className={styles.itemTitle}>{item.title}</h3>
            {item.audience && (
              <span className={styles.audience}>{item.audience}</span>
            )}
          </div>
          <div className={styles.itemMetaRow}>
            <span className={styles.itemDate}>{item.createdAt}</span>
          </div>
        </div>
        <button
          type="button"
          className={styles.seeDetails}
          onClick={(e) => {
            e.stopPropagation();
            onView(item.id);
          }}
        >
          See details
          <ChevronRight size={14} />
        </button>
      </div>
      <p className={styles.itemBody}>{item.body}</p>
    </div>
  );
}

export function AnnouncementsFeed({
  announcements,
  query,
  page,
  onQuery,
  onPageChange,
  onView,
}: AnnouncementsFeedProps) {
  const q = query.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(q);

  const filtered = q
    ? announcements.filter(
        (a) => matches(a.title) || matches(a.body) || matches(a.authorName),
      )
    : announcements;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className={styles.card}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>
          <Megaphone size={16} />
          Published Announcements
        </span>
        <SearchInput
          value={query}
          onChange={onQuery}
          placeholder="Search announcements, authors…"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.body}>
        {slice.length === 0 ? (
          <Empty
            icon={q ? <Search size={20} /> : <Megaphone size={20} />}
            title={q ? "No matching announcements" : "No announcements yet"}
            sub={q ? "Try a different search." : "Publish the first update for everyone."}
          />
        ) : (
          <div className={styles.list}>
            {slice.map((a) => (
              <AnnouncementCard
                key={a.id}
                item={a}
                onView={onView}
              />
            ))}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className={styles.cardFoot}>
          <Pagination
            page={safePage}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
