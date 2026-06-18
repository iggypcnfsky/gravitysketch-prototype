import type { AppState } from "./types";

export const DEFAULT_CANVAS_ID = "sailing-boat-canvas";

const EMPTY_CANVAS_NODES: AppState["canvases"][number]["nodes"] = [];
const EMPTY_CANVAS_VIEWPORT = { x: 0, y: 0, zoom: 1 };

export const SEED_STATE: AppState = {
  rooms: [
    {
      id: "sailing-boat",
      name: "Sailing Boat",
      type: "room",
      updatedAt: "9 minutes ago",
      models: ["boat"],
    },
    {
      id: "concept-car",
      name: "Concept Car",
      type: "room",
      updatedAt: "2 days ago",
    },
  ],
  canvases: [
    {
      id: DEFAULT_CANVAS_ID,
      name: "Sailing Boat",
      type: "canvas",
      updatedAt: "2 minutes ago",
      linkedRoomId: "sailing-boat",
      nodes: [
        {
          id: "boat-sketch",
          type: "boatSketch",
          position: { x: 377, y: 247 },
          data: {},
          draggable: true,
          selectable: true,
        },
        {
          id: "image-ref-1",
          type: "imagePlaceholder",
          position: { x: 80, y: 120 },
          data: {
            seed: "boat-ref-1",
            position3d: { x: -2.56, y: 0.6, z: -1.44 },
          },
          draggable: true,
          selectable: true,
        },
        {
          id: "image-ref-2",
          type: "imagePlaceholder",
          position: { x: 620, y: 160 },
          data: {
            seed: "boat-ref-2",
            position3d: { x: 1.76, y: 0.6, z: -1.12 },
          },
          draggable: true,
          selectable: true,
        },
        {
          id: "image-ref-3",
          type: "imagePlaceholder",
          position: { x: 220, y: 420 },
          data: {
            seed: "boat-ref-3",
            position3d: { x: -1.44, y: 0.6, z: 0.96 },
          },
          draggable: true,
          selectable: true,
        },
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    {
      id: "shoe-ideation",
      name: "Shoe Ideation",
      type: "canvas",
      updatedAt: "1 hour ago",
      nodes: EMPTY_CANVAS_NODES,
      edges: [],
      viewport: EMPTY_CANVAS_VIEWPORT,
    },
  ],
  recents: [
    {
      id: "sailing-boat",
      name: "Sailing Boat",
      type: "room",
      updatedAt: "9 minutes ago",
    },
    {
      id: DEFAULT_CANVAS_ID,
      name: "Sailing Boat",
      type: "canvas",
      updatedAt: "2 minutes ago",
      linkedRoomId: "sailing-boat",
      nodes: EMPTY_CANVAS_NODES,
      edges: [],
      viewport: EMPTY_CANVAS_VIEWPORT,
    },
    {
      id: "concept-car",
      name: "Concept Car",
      type: "room",
      updatedAt: "2 days ago",
    },
    {
      id: "shoe-ideation",
      name: "Shoe Ideation",
      type: "canvas",
      updatedAt: "1 hour ago",
      nodes: EMPTY_CANVAS_NODES,
      edges: [],
      viewport: EMPTY_CANVAS_VIEWPORT,
    },
  ],
  screenshots: [
    {
      id: "ss-sailing-top",
      name: "Sailing Boat – Top view",
      type: "screenshot",
      updatedAt: "Yesterday",
      seed: "ss-sailing-top",
      roomId: "sailing-boat",
    },
    {
      id: "ss-sailing-side",
      name: "Sailing Boat – Side view",
      type: "screenshot",
      updatedAt: "Yesterday",
      seed: "ss-sailing-side",
      roomId: "sailing-boat",
    },
    {
      id: "ss-concept-car",
      name: "Concept Car – Perspective",
      type: "screenshot",
      updatedAt: "3 days ago",
      seed: "ss-concept-car",
      roomId: "concept-car",
    },
    {
      id: "ss-helmet",
      name: "Helmet Concept – Render",
      type: "screenshot",
      updatedAt: "Last week",
      seed: "ss-helmet",
    },
  ],
  shared: [
    {
      id: "shared-helmet",
      name: "Helmet Concept",
      type: "room",
      updatedAt: "3 days ago",
      sharedBy: "Alex M.",
    },
    {
      id: "shared-chair",
      name: "Lounge Chair",
      type: "room",
      updatedAt: "5 days ago",
      sharedBy: "Jordan K.",
    },
    {
      id: "shared-moodboard",
      name: "EV Moodboard",
      type: "canvas",
      updatedAt: "1 week ago",
      sharedBy: "Sam T.",
      nodes: EMPTY_CANVAS_NODES,
      edges: [],
      viewport: EMPTY_CANVAS_VIEWPORT,
    },
  ],
  trash: [
    {
      id: "trash-drone",
      name: "Delivery Drone",
      type: "room",
      updatedAt: "Deleted 2 days ago",
    },
    {
      id: "trash-sketch",
      name: "Early Sketches",
      type: "canvas",
      updatedAt: "Deleted 1 week ago",
      nodes: EMPTY_CANVAS_NODES,
      edges: [],
      viewport: EMPTY_CANVAS_VIEWPORT,
    },
    {
      id: "trash-watch",
      name: "Smartwatch v2",
      type: "room",
      updatedAt: "Deleted 2 weeks ago",
    },
  ],
  storageUsed: "0B",
  storageTotal: "150 MB",
};
