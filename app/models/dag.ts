/**
 * DAG数据结构类型定义
 * 用于在前后端之间共享一致的模型定义
 */

// 节点类型枚举，用于标识不同类型的节点
export enum NodeType {
  START = 'start',
  PROCESS = 'process',
  DECISION = 'decision',
  END = 'end'
}

// 边类型枚举，用于标识不同类型的连接线
export enum EdgeType {
  DEFAULT = 'default',
  SMOOTHSTEP = 'smoothstep',
  STRAIGHT = 'straight',
  BEZIER = 'bezier'
}

// 连接点位置枚举
export enum HandlePosition {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left'
}

// 节点数据接口，定义节点的结构
export interface DAGNode {
  id: string;
  type: string;
  data: {
    label: string;
    description?: string;
    type: NodeType | string;
  };
  // 可选的位置信息，如果有具体坐标可以提供
  position?: {
    x: number;
    y: number;
  };
}

// 边接口，定义连接线的结构
export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  type: EdgeType | string;
  // 源和目标连接点标识符
  sourceHandle?: string;
  targetHandle?: string;
  // 用于自定义边的风格
  style?: {
    strokeWidth?: number;
    stroke?: string;
  };
}

// 完整的DAG图数据结构
export interface DAGData {
  nodes: DAGNode[];
  edges: DAGEdge[];
}

/**
 * 创建一个默认的DAG数据结构
 * @returns 包含默认节点和边的DAG数据
 */
export function createDefaultDAG(): DAGData {
  return {
    nodes: [
      {
        id: 'start',
        type: 'custom',
        data: { label: '开始任务', type: NodeType.START },
      },
      {
        id: 'process',
        type: 'custom',
        data: { 
          label: '处理任务', 
          description: '处理用户请求',
          type: NodeType.PROCESS,
        },
      },
      {
        id: 'end',
        type: 'custom',
        data: { label: '完成任务', type: NodeType.END },
      },
    ],
    edges: [
      {
        id: 'edge-start-process',
        source: 'start',
        target: 'process',
        animated: true,
        type: EdgeType.SMOOTHSTEP,
        sourceHandle: HandlePosition.BOTTOM,
        targetHandle: HandlePosition.TOP,
      },
      {
        id: 'edge-process-end',
        source: 'process',
        target: 'end',
        animated: true,
        type: EdgeType.SMOOTHSTEP,
        sourceHandle: HandlePosition.BOTTOM,
        targetHandle: HandlePosition.TOP,
      },
    ],
  };
} 