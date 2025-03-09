'use client';

import {
	ReactFlow,
	Controls,
	MiniMap,
	Background,
	Panel,
	ConnectionLineType,
	useNodesState,
	useEdgesState,
	type Node,
	type Edge,
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { type DAGData, type DAGNode, type DAGEdge, HandlePosition } from '../models/dag';

// 节点自定义数据接口
interface CustomNodeData {
  label: string;
  description?: string;
  type: string;
}

function CustomNode({ data }: { data: CustomNodeData }) {
  // 根据节点类型选择样式
  const getNodeStyle = () => {
    switch (data.type) {
      case 'start':
        return 'bg-blue-100 border-blue-500';
      case 'process':
        return 'bg-green-100 border-green-500';
      case 'decision':
        return 'bg-yellow-100 border-yellow-500';
      case 'end':
        return 'bg-red-100 border-red-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  return (
    <div className={`px-4 py-2 shadow rounded-md border-2 ${getNodeStyle()}`}>
      <div className="font-bold">{data.label}</div>
      {data.description && (
        <div className="text-xs text-gray-700 mt-1">{data.description}</div>
      )}
    </div>
  );
}

// 注册自定义节点类型
const nodeTypes = {
  custom: CustomNode,
};

interface DAGVisualizationProps {
  dagData: DAGData;
}

export default function DAGVisualization({ dagData }: DAGVisualizationProps) {
  // 处理ReactFlow节点和边的格式
  const formatNodes = (nodes: DAGNode[]): Node[] => {
    return nodes.map((node, index) => ({
      id: node.id,
      type: node.type,
      data: node.data,
      position: node.position || { 
        x: 100 + (index % 3) * 250, // 水平布局，最多3列
        y: 50 + Math.floor(index / 3) * 120 // 垂直布局
      },
    }));
  };

  const formatEdges = (edges: DAGEdge[]): Edge[] => {
    return edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated,
      type: edge.type,
      style: edge.style,
      sourceHandle: edge.sourceHandle || HandlePosition.BOTTOM,
      targetHandle: edge.targetHandle || HandlePosition.TOP,
    }));
  };

  // 初始化流程图数据
  const [nodes, /* setNodes */, onNodesChange] = useNodesState(formatNodes(dagData.nodes));
  const [edges, /* setEdges */, onEdgesChange] = useEdgesState(formatEdges(dagData.edges));

  return (
    <div className="w-full h-full flex flex-col">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={2}
        className="border-0 flex-1"
      >
        <Controls 
          position="bottom-right" 
          showInteractive={false}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md"
        />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
          position="top-right"
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md"
        />
        <Background color="#f8f8f8" gap={16} />
        <Panel position="top-left">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 rounded-lg shadow-md text-sm font-medium">
            节点数量: {nodes.length}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
} 