"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeChange,
  type OnMove,
  type OnNodeDrag,
  type Viewport,
} from "@xyflow/react";
import { Check, Eraser, Pencil, Plus, Type } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { CANVAS_SYNC_EVENT } from "@/lib/canvas-sync";
import {
  computeSketchBounds,
  DEFAULT_TEXT_FONT_SIZE,
  flowStrokesToLocal,
  nodePositionTo3D,
  type SketchStroke,
} from "@/lib/canvas-sync";
import { getCanvas, saveCanvas, updateCanvasElementFromCanvas } from "@/lib/store";
import { BoatSketchNode } from "./BoatSketchNode";
import { CanvasNodeContext } from "./CanvasNodeContext";
import { ImagePlaceholderNode } from "./ImagePlaceholderNode";
import { SketchDrawingOverlay } from "./SketchDrawingOverlay";
import { SketchNode } from "./SketchNode";
import { TextNode } from "./TextNode";
import styles from "./CanvasFlow.module.css";

const nodeTypes = {
  boatSketch: BoatSketchNode,
  imagePlaceholder: ImagePlaceholderNode,
  canvasText: TextNode,
  canvasSketch: SketchNode,
};

type SketchMode = "draw" | "erase";

interface CanvasFlowInnerProps {
  canvasId: string;
  onExternalSync?: () => void;
}

function CanvasFlowInner({ canvasId, onExternalSync }: CanvasFlowInnerProps) {
  const flowRef = useRef<HTMLDivElement>(null);
  const initialCanvas = getCanvas(canvasId);

  const loadNodes = useCallback(() => getCanvas(canvasId)?.nodes ?? [], [canvasId]);

  const [nodes, setNodes] = useState<Node[]>(loadNodes);
  const [viewport, setViewport] = useState<Viewport>(
    initialCanvas?.viewport ?? { x: 0, y: 0, zoom: 1 },
  );
  const [sketchMode, setSketchMode] = useState<SketchMode | null>(null);
  const [sessionStrokes, setSessionStrokes] = useState<SketchStroke[]>([]);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const framedCanvasRef = useRef<string | null>(null);

  const reloadFromStore = useCallback(() => {
    const canvas = getCanvas(canvasId);
    if (!canvas) return;
    setNodes(canvas.nodes);
    onExternalSync?.();
  }, [canvasId, onExternalSync]);

  useEffect(() => {
    framedCanvasRef.current = null;
    setNodes(loadNodes());
  }, [canvasId, loadNodes]);

  useEffect(() => {
    if (nodes.length === 0) return;
    if (framedCanvasRef.current === canvasId) return;

    const timer = window.setTimeout(() => {
      fitView({ padding: 0.32, maxZoom: 1.4, duration: 220 });
      framedCanvasRef.current = canvasId;
    }, 80);

    return () => window.clearTimeout(timer);
  }, [canvasId, nodes.length, fitView]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ canvasId: string }>).detail;
      if (detail?.canvasId === canvasId) reloadFromStore();
    };
    window.addEventListener(CANVAS_SYNC_EVENT, handler);
    return () => window.removeEventListener(CANVAS_SYNC_EVENT, handler);
  }, [canvasId, reloadFromStore]);

  const onMove: OnMove = useCallback((_event, vp) => {
    setViewport(vp);
  }, []);

  const persist = useCallback(
    (nextNodes: Node[], nextViewport: Viewport, emitSync = false) => {
      const canvas = getCanvas(canvasId);
      if (!canvas) return;
      saveCanvas(
        {
          ...canvas,
          nodes: nextNodes,
          viewport: nextViewport,
        },
        emitSync,
      );
    },
    [canvasId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      persist(nodes, viewport, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [nodes, viewport, persist]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const syncElement = useCallback(
    (nodeId: string, patch: Parameters<typeof updateCanvasElementFromCanvas>[2]) => {
      updateCanvasElementFromCanvas(canvasId, nodeId, patch);
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== nodeId) return node;
          return {
            ...node,
            position: patch.position ?? node.position,
            data: {
              ...(node.data ?? {}),
              ...patch,
            },
          };
        }),
      );
    },
    [canvasId],
  );

  const onNodeDragStop: OnNodeDrag<Node> = useCallback(
    (_event, node) => {
      if (
        node.type !== "imagePlaceholder" &&
        node.type !== "canvasText" &&
        node.type !== "canvasSketch"
      ) {
        return;
      }
      updateCanvasElementFromCanvas(canvasId, node.id, { position: node.position });
    },
    [canvasId],
  );

  const addNodeAtCenter = useCallback(() => {
    if (!flowRef.current) return null;

    const rect = flowRef.current.getBoundingClientRect();
    return screenToFlowPosition({
      x: rect.left + rect.width * 0.45,
      y: rect.top + rect.height * 0.5,
    });
  }, [screenToFlowPosition]);

  const handleAddImage = useCallback(() => {
    const position = addNodeAtCenter();
    if (!position) return;

    const id = `image-${Date.now()}`;
    const seed = `new-${Date.now()}`;
    const imageData = { seed, scale: 1, rotation: 0 };
    const newNode: Node = {
      id,
      type: "imagePlaceholder",
      position,
      data: {
        ...imageData,
        position3d: nodePositionTo3D("imagePlaceholder", position, imageData),
      },
      draggable: true,
      selectable: true,
      selected: true,
    };

    setNodes((nds) => {
      const nextNodes = [...nds.map((node) => ({ ...node, selected: false })), newNode];
      const canvas = getCanvas(canvasId);
      if (canvas) saveCanvas({ ...canvas, nodes: nextNodes }, true);
      return nextNodes;
    });
  }, [addNodeAtCenter, canvasId]);

  const handleAddText = useCallback(() => {
    const position = addNodeAtCenter();
    if (!position) return;

    const id = `text-${Date.now()}`;
    const textData = {
      text: "Label",
      fontSize: DEFAULT_TEXT_FONT_SIZE,
      scale: 1,
      rotation: 0,
    };
    const newNode: Node = {
      id,
      type: "canvasText",
      position,
      data: {
        ...textData,
        position3d: nodePositionTo3D("canvasText", position, textData),
      },
      draggable: true,
      selectable: true,
      selected: true,
    };

    setNodes((nds) => {
      const nextNodes = [...nds.map((node) => ({ ...node, selected: false })), newNode];
      const canvas = getCanvas(canvasId);
      if (canvas) saveCanvas({ ...canvas, nodes: nextNodes }, true);
      return nextNodes;
    });
  }, [addNodeAtCenter, canvasId]);

  const handleStartSketch = useCallback(() => {
    setSketchMode("draw");
    setSessionStrokes([]);
  }, []);

  const handleFinalizeSketch = useCallback(() => {
    if (sessionStrokes.length === 0) {
      setSketchMode(null);
      return;
    }

    const bounds = computeSketchBounds(sessionStrokes);
    if (!bounds) {
      setSketchMode(null);
      setSessionStrokes([]);
      return;
    }

    const id = `sketch-${Date.now()}`;
    const localStrokes = flowStrokesToLocal(sessionStrokes, {
      x: bounds.minX,
      y: bounds.minY,
    });
    const sketchData = {
      width: bounds.width,
      height: bounds.height,
      strokes: localStrokes,
      scale: 1,
      rotation: 0,
    };
    const position = { x: bounds.minX, y: bounds.minY };
    const newNode: Node = {
      id,
      type: "canvasSketch",
      position,
      data: {
        ...sketchData,
        position3d: nodePositionTo3D("canvasSketch", position, sketchData),
      },
      draggable: true,
      selectable: true,
      selected: true,
    };

    setNodes((nds) => {
      const nextNodes = [...nds.map((node) => ({ ...node, selected: false })), newNode];
      const canvas = getCanvas(canvasId);
      if (canvas) saveCanvas({ ...canvas, nodes: nextNodes }, true);
      return nextNodes;
    });

    setSessionStrokes([]);
    setSketchMode(null);
  }, [canvasId, sessionStrokes]);

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 1 }), []);
  const isSketching = sketchMode !== null;

  return (
    <CanvasNodeContext.Provider value={{ canvasId, syncElement }}>
      <div className={styles.flow} ref={flowRef}>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onMove={onMove}
          defaultViewport={defaultViewport}
          minZoom={0.25}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          fitView={false}
          elementsSelectable={!isSketching}
          selectNodesOnDrag={false}
          nodesDraggable={!isSketching}
          panOnDrag={!isSketching}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#B0B0B0" />
        </ReactFlow>

        {isSketching ? (
          <SketchDrawingOverlay
            mode={sketchMode}
            sessionStrokes={sessionStrokes}
            viewport={viewport}
            onSessionStrokesChange={setSessionStrokes}
          />
        ) : null}

        <div className={styles.addToolbar}>
          {isSketching ? (
            <div className={styles.sketchToolbar}>
              <button
                type="button"
                className={`${styles.addBtn} ${sketchMode === "draw" ? styles.addBtnActive : ""}`}
                onClick={() => setSketchMode("draw")}
                aria-label="Draw on canvas"
              >
                <Pencil size={20} strokeWidth={2} color={sketchMode === "draw" ? "#7B3FF2" : "#FFFFFF"} />
              </button>
              <button
                type="button"
                className={`${styles.addBtn} ${sketchMode === "erase" ? styles.addBtnActive : ""}`}
                onClick={() => setSketchMode("erase")}
                aria-label="Erase sketch strokes"
              >
                <Eraser size={20} strokeWidth={2} color={sketchMode === "erase" ? "#7B3FF2" : "#FFFFFF"} />
              </button>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleFinalizeSketch}
                aria-label="Finish sketch"
              >
                <Check size={22} strokeWidth={2} color="#FFFFFF" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleAddText}
                aria-label="Add text to canvas"
              >
                <Type size={20} strokeWidth={2} color="#FFFFFF" />
              </button>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleAddImage}
                aria-label="Add image to canvas"
              >
                <Plus size={22} strokeWidth={2} color="#FFFFFF" />
              </button>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleStartSketch}
                aria-label="Add sketch to canvas"
              >
                <Pencil size={20} strokeWidth={2} color="#FFFFFF" />
              </button>
            </>
          )}
        </div>
      </div>
    </CanvasNodeContext.Provider>
  );
}

interface CanvasFlowProps {
  canvasId: string;
  onExternalSync?: () => void;
}

export function CanvasFlow({ canvasId, onExternalSync }: CanvasFlowProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner canvasId={canvasId} onExternalSync={onExternalSync} />
    </ReactFlowProvider>
  );
}
