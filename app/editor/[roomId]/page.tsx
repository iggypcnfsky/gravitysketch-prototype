import { EditorPageClient } from "@/components/editor/EditorPageClient";

interface EditorPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { roomId } = await params;
  return <EditorPageClient roomId={roomId} />;
}
