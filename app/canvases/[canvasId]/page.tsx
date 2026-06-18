import { AppShell } from "@/components/layout/AppShell";
import { CanvasPageClient } from "@/components/canvas/CanvasPageClient";

interface CanvasEditorPageProps {
  params: Promise<{ canvasId: string }>;
}

export default async function CanvasEditorPage({ params }: CanvasEditorPageProps) {
  const { canvasId } = await params;
  return (
    <AppShell activeNav="canvases">
      <CanvasPageClient canvasId={canvasId} />
    </AppShell>
  );
}
