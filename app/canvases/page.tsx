import { AppShell } from "@/components/layout/AppShell";
import { CanvasesPanel } from "@/components/canvas/CanvasesPanel";

export default function CanvasesPage() {
  return (
    <AppShell activeNav="canvases">
      <CanvasesPanel />
    </AppShell>
  );
}
