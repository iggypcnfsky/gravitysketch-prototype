import { AppShell } from "@/components/layout/AppShell";
import { FilesPanel } from "@/components/files/FilesPanel";

export default function RecentsPage() {
  return (
    <AppShell activeNav="recents">
      <FilesPanel section="recents" />
    </AppShell>
  );
}
