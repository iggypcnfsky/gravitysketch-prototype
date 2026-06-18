import { AppShell } from "@/components/layout/AppShell";
import { FilesPanel } from "@/components/files/FilesPanel";

export default function ScreenshotsPage() {
  return (
    <AppShell activeNav="screenshots">
      <FilesPanel section="screenshots" />
    </AppShell>
  );
}
