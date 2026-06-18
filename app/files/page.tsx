import { AppShell } from "@/components/layout/AppShell";
import { FilesPanel } from "@/components/files/FilesPanel";

export default function FilesPage() {
  return (
    <AppShell activeNav="files">
      <FilesPanel section="files" />
    </AppShell>
  );
}
