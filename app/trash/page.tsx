import { AppShell } from "@/components/layout/AppShell";
import { FilesPanel } from "@/components/files/FilesPanel";

export default function TrashPage() {
  return (
    <AppShell activeNav="trash">
      <FilesPanel section="trash" />
    </AppShell>
  );
}
