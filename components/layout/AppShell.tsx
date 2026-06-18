"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NavSection } from "@/lib/types";
import styles from "./AppShell.module.css";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  activeNav: NavSection;
  children: React.ReactNode;
}

export function AppShell({ activeNav, children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className={`${styles.shell} ${sidebarCollapsed ? styles.shellCollapsed : styles.shellExpanded}`}
    >
      <Sidebar activeNav={activeNav} collapsed={sidebarCollapsed} />
      <button
        type="button"
        className={styles.collapseBtn}
        onClick={() => setSidebarCollapsed((value) => !value)}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? (
          <ChevronRight size={14} strokeWidth={2} />
        ) : (
          <ChevronLeft size={14} strokeWidth={2} />
        )}
      </button>
      <div className={styles.main}>
        <TopBar />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
