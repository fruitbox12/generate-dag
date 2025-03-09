/**
 * DAG数据结构类型定义
 * 用于在前后端之间共享一致的模型定义
 */

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

// 布局方向枚举
export enum LayoutDirection {
  TOP_TO_BOTTOM = 'TB',  // 自上而下
  LEFT_TO_RIGHT = 'LR',  // 从左到右
  BOTTOM_TO_TOP = 'BT',  // 自下而上
  RIGHT_TO_LEFT = 'RL'   // 从右到左
}

// 节点数据接口，定义节点的结构
export interface DAGNode {
  id: string;
  type: string;
  data: {
    label: string;
    description?: string;
  };
  // 可选的位置信息，如果有具体坐标可以提供
  position?: {
    x: number;
    y: number;
  };
  // 连接点位置，用于控制边的连接点
  sourcePosition?: HandlePosition;
  targetPosition?: HandlePosition;
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
  // 布局方向，默认自上而下
  layoutDirection?: LayoutDirection;
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
        type: 'default',
        data: { label: '开始任务' },
        sourcePosition: HandlePosition.BOTTOM,
        targetPosition: HandlePosition.TOP
      },
      {
        id: 'process',
        type: 'default',
        data: { 
          label: '处理任务', 
          description: '处理用户请求'
        },
        sourcePosition: HandlePosition.BOTTOM,
        targetPosition: HandlePosition.TOP
      },
      {
        id: 'end',
        type: 'default',
        data: { label: '完成任务' },
        sourcePosition: HandlePosition.BOTTOM,
        targetPosition: HandlePosition.TOP
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
    layoutDirection: LayoutDirection.TOP_TO_BOTTOM
  };
} 