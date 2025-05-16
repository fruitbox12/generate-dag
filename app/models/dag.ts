/**
 * DAG data structure type definitions
 * Shared between backend and frontend
 */

/* ── Edge types supported by React Flow ─────────────────────────────────────── */
export enum EdgeType {
  DEFAULT    = 'default',
  SMOOTHSTEP = 'smoothstep',
  STRAIGHT   = 'straight',
  BEZIER     = 'bezier',
}

/* ── Handle positions (“ports”) ─────────────────────────────────────────────── */
export enum HandlePosition {
  TOP    = 'top',
  RIGHT  = 'right',
  BOTTOM = 'bottom',
  LEFT   = 'left',
}

/* ── Layout directions for Dagre ────────────────────────────────────────────── */
export enum LayoutDirection {
  TOP_TO_BOTTOM = 'TB',
  LEFT_TO_RIGHT = 'LR',
  BOTTOM_TO_TOP = 'BT',
  RIGHT_TO_LEFT = 'RL',
}

/* ── Node and edge interfaces ──────────────────────────────────────────────── */

export interface DAGNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  sourcePosition?: HandlePosition;
  targetPosition?: HandlePosition;
}

export interface DAGNode {
  id: string;
  type: string; // "default", "customNode", etc.
  data: DAGNodeData;
  position?: { x: number; y: number };

  sourcePosition?: HandlePosition;
  targetPosition?: HandlePosition;
}

/** Edge with literal-union handles */
export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  type: EdgeType | string;

  sourceHandle: 'right' | 'left' | 'top' | 'bottom';
  targetHandle: 'right' | 'left' | 'top' | 'bottom';

  style?: { strokeWidth?: number; stroke?: string };
}

export interface DAGData {
  nodes: DAGNode[];
  edges: DAGEdge[];
  layoutDirection?: LayoutDirection;
}

/* ── Helper: default DAG (for empty/fallback cases) ────────────────────────── */
export function createDefaultDAG(): DAGData {
  return {
    nodes: [
      {
        id: 'start',
        type: 'default',
        data: { label: 'Start Task' },
        sourcePosition: HandlePosition.RIGHT,
      },
      {
        id: 'process',
        type: 'default',
        data: {
          label: 'Process Task',
          description: 'Handle user request',
        },
        sourcePosition: HandlePosition.RIGHT,
        targetPosition: HandlePosition.LEFT,
      },
      {
        id: 'end',
        type: 'default',
        data: { label: 'Complete Task' },
        sourcePosition: HandlePosition.RIGHT,
        targetPosition: HandlePosition.LEFT,
      },
    ],
    edges: [
      {
        id: 'edge-start-process',
        source: 'start',
        target: 'process',
        animated: true,
        type: EdgeType.SMOOTHSTEP,
        sourceHandle: 'right', // ← literal, not widened to string
        targetHandle: 'left',
      },
      {
        id: 'edge-process-end',
        source: 'process',
        target: 'end',
        animated: true,
        type: EdgeType.SMOOTHSTEP,
        sourceHandle: 'right',
        targetHandle: 'left',
      },
    ],
    layoutDirection: LayoutDirection.LEFT_TO_RIGHT,
  };
}
