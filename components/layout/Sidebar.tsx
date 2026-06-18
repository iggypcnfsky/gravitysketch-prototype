"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Folder,
  ImageIcon,
  LayoutGrid,
  Link2,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavSection } from "@/lib/types";
import { getStorageInfo } from "@/lib/store";
import styles from "./Sidebar.module.css";

interface NavItem {
  id: NavSection;
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "files", label: "My files", href: "/files", icon: Folder },
  { id: "canvases", label: "Canvases", href: "/canvases", icon: LayoutGrid },
  { id: "recents", label: "Recents", href: "/recents", icon: Clock },
  { id: "screenshots", label: "Screenshots", href: "/screenshots", icon: ImageIcon },
  { id: "shared", label: "Shared with me", href: "/shared", icon: Users },
  { id: "trash", label: "Trash", href: "/trash", icon: Trash2 },
];

interface SidebarProps {
  activeNav: NavSection;
  collapsed: boolean;
}

export function Sidebar({ activeNav, collapsed }: SidebarProps) {
  const storage = getStorageInfo();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
      <div className={styles.top}>
        <div className={styles.logoWrap}>
          <Image
            src={
              collapsed
                ? "https://gravitysketch.com/wp-content/uploads/2024/08/logomark.png"
                : "/gravity-sketch-logo.svg"
            }
            alt="Gravity Sketch"
            width={collapsed ? 28 : 160}
            height={collapsed ? 28 : 27}
            className={collapsed ? styles.logoMark : styles.logo}
            priority
          />
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeNav;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} strokeWidth={1.5} color={isActive ? "#FFFFFF" : "#888888"} />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className={styles.bottom}>
        <div className={styles.divider} />
        <button type="button" className={styles.joinBtn} title="Join Room with code">
          <Link2 size={16} strokeWidth={1.5} />
          <span className={styles.joinBtnText}>Join Room with code</span>
        </button>
        <div className={styles.storage}>
          <div className={styles.storageHeader}>
            <span className={styles.storageLabel}>STORAGE</span>
            <span className={styles.storageValue}>
              {storage.used}/{storage.total}
            </span>
          </div>
          <div className={styles.progressBar} />
        </div>
      </div>
    </aside>
  );
}
