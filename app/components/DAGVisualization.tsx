'use client';

import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  Panel,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Position,
  Handle
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import type { DAGData } from "../models/dag";

// 定义节点数据类型，包括是否为触发节点
interface NodeData {
  label: string;
  description?: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  isTrigger?: boolean;
}

// 自定义节点组件
function CustomNode(props: { data: NodeData }) {
  const { data } = props;
  const srcPos = data.sourcePosition ?? Position.Bottom;
  const tgtPos = data.targetPosition ?? Position.Top;
  return (
    <div className="px-4 py-3 shadow-lg rounded-md border-2 bg-white dark:bg-gray-800 border-blue-500 hover:border-blue-600 transition-colors duration-300 hover:shadow-xl">
      {/* 只有非触发节点才显示左侧输入句柄 */}
      {!data.isTrigger && (
        <Handle
          type="target"
          position={tgtPos}
          id="target"
          style={{ background: '#3b82f6', width: '8px', height: '8px' }}
          className="border-2 border-white dark:border-gray-800"
        />
      )}
      <div className="font-bold text-blue-600 dark:text-blue-400">{data.label}</div>
      {data.description && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2">{data.description}</div>
      )}
      {/* 源点句柄始终显示在右侧，用于触发下一节点 */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        style={{ background: '#3b82f6', width: '8px', height: '8px' }}
        className="border-2 border-white dark:border-gray-800"
      />
    </div>
  );
}

const nodeTypes = {
  default: CustomNode,
};

interface DAGVisualizationProps {
  dagData: DAGData;
}

function DAGVisualizationFlow({ dagData }: DAGVisualizationProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const applyLayout = useCallback((direction: 'LR' | 'TB' = 'LR') => {
    if (!dagData?.nodes?.length) return;

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    const nodeWidth = 180;
    const nodeHeight = 60;

    // 准备基础节点数据
    const basicNodes = dagData.nodes.map((node, index) => ({
      id: node.id,
      data: { ...node.data },
      type: node.type || 'default',
      position: { x: 0, y: 0 },
      isTrigger: index === 0, // 第一个节点为触发节点
    }));

    // 准备基础边数据
    const basicEdges = dagData.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated ?? true,
      type: edge.type || 'smoothstep',
      sourceHandle: 'source',
      targetHandle: 'target',
      style: edge.style,
    }));

    // 将节点和边添加至 dagre
    basicNodes.forEach(node => dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight }));
    basicEdges.forEach(edge => dagreGraph.setEdge(edge.source, edge.target));
    dagre.layout(dagreGraph);

    // 计算布局并注入 handle 位置
    const positioned = basicNodes.map((node, index) => {
      const d = dagreGraph.node(node.id);
      const isHorizontal = direction === 'LR' || direction === 'RL';

      // 触发节点始终只有源点（右侧）
      const srcPos = Position.Right;
      const tgtPos = node.isTrigger ? undefined : (isHorizontal ? Position.Left : Position.Top);

      return {
        ...node,
        position: { x: d.x - nodeWidth / 2, y: d.y - nodeHeight / 2 },
        data: { ...node.data, sourcePosition: srcPos, targetPosition: tgtPos, isTrigger: node.isTrigger },
        // 对于触发节点，不设 targetPosition
        sourcePosition: srcPos as Position,
        targetPosition: tgtPos as Position,
      };
    });

    // 更新状态
    // @ts-expect-error
    setNodes(positioned);
    // @ts-expect-error
    setEdges(basicEdges);
  }, [dagData, setNodes, setEdges]);

  // 初始化布局及响应数据更改
  useEffect(() => {
    const dir = dagData.layoutDirection ?? 'LR';
    applyLayout(dir as 'LR' | 'TB');
  }, [dagData, applyLayout]);

  // 处理方向切换
  const handleDirectionChange = (direction: 'LR' | 'TB') => applyLayout(direction);

  return (
    <div className="w-full h-full">
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
        defaultEdgeOptions={{ style: { strokeWidth: 2, stroke: '#64748b' }, animated: true }}
      >
        <Controls position="bottom-right" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-1" showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          position="top-right"
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg"
          nodeColor={() => '#3b82f6'}
          maskColor="rgba(240, 240, 245, 0.4)"
        />
        <Background color="#3b82f6" gap={20} size={1} />
        <Panel position="top-left">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full inline-block" />
            <span className="text-gray-700 dark:text-gray-300">number of nodes: {nodes.length}</span>
          </div>
        </Panel>
        <Panel position="top-right">
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={() => handleDirectionChange('TB')}
              className="px-3.5 py-2 bg-blue-500 text-white rounded-md text-sm shadow-md hover:bg-blue-600 transition-colors duration-300 flex items-center space-x-1.5"
            >
              <span className="text-lg">⬇️</span>
              <span>Top to bottom</span>
            </button>
            <button
              type="button"
              onClick={() => handleDirectionChange('LR')}
              className="px-3.5 py-2 bg-gray-500 text-white rounded-md text-sm shadow-md hover:bg-gray-600 transition-colors duration-300 flex items-center space-x-1.5"
            >
              <span className="text-lg">➡️</span>
              <span>Left to right</span>
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function DAGVisualization(props: DAGVisualizationProps) {
  return (
    <ReactFlowProvider>
      <DAGVisualizationFlow {...props} />
    </ReactFlowProvider>
  );
}
