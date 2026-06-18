import { AppShell } from "@/components/layout/AppShell";
import { FilesPanel } from "@/components/files/FilesPanel";

export default function SharedPage() {
  return (
    <AppShell activeNav="shared">
      <FilesPanel section="shared" />
    </AppShell>
  );
}
