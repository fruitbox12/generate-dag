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

// 定义节点数据类型
interface NodeData {
	label: string;
	description?: string;
}

// 自定义节点组件
function CustomNode(props: { data: NodeData }) {
	const { data } = props;
	return (
		<div className="px-4 py-3 shadow-lg rounded-md border-2 bg-white dark:bg-gray-800 border-blue-500 hover:border-blue-600 transition-colors duration-300 hover:shadow-xl">
			<Handle
				type="target"
				position={Position.Top}
				id="top"
				style={{ background: '#3b82f6', top: 0, width: '8px', height: '8px' }}
				className="border-2 border-white dark:border-gray-800"
			/>
			<div className="font-bold text-blue-600 dark:text-blue-400">{data.label}</div>
			{data.description && (
				<div className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2">{data.description}</div>
			)}
			<Handle
				type="source"
				position={Position.Bottom}
				id="bottom"
				style={{ background: '#3b82f6', bottom: 0, width: '8px', height: '8px' }}
				className="border-2 border-white dark:border-gray-800"
			/>
		</div>
	);
}

// 注册自定义节点类型
const nodeTypes = {
	default: CustomNode,
};

interface DAGVisualizationProps {
	dagData: DAGData;
}

// 主布局组件
function DAGVisualizationFlow({ dagData }: DAGVisualizationProps) {
	// 状态管理 - 忽略类型错误以避免复杂的类型定义
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);

	// 应用布局
	const applyLayout = useCallback((direction = 'TB') => {
		if (!dagData || !dagData.nodes.length) return;

		// 创建一个新的dagre图实例
		const dagreGraph = new dagre.graphlib.Graph();
		dagreGraph.setDefaultEdgeLabel(() => ({}));
		dagreGraph.setGraph({ rankdir: direction });

		// 节点宽高设置
		const nodeWidth = 180;
		const nodeHeight = 60;

		// 1. 准备节点数据
		const basicNodes = dagData.nodes.map(node => ({
			id: node.id,
			data: node.data,
			type: node.type || 'default',
			position: { x: 0, y: 0 }, // 初始位置，会被dagre重新计算
		}));

		// 2. 准备边数据 - 确保使用正确的handle ID
		const basicEdges = dagData.edges.map(edge => {
			// 创建一个新的边对象，确保Handle ID正确
			return {
				id: edge.id,
				source: edge.source,
				target: edge.target,
				animated: edge.animated || false,
				type: edge.type || 'smoothstep',
				// 直接使用自定义节点组件中定义的handle ID
				sourceHandle: 'bottom', // 与CustomNode中定义的id一致
				targetHandle: 'top',    // 与CustomNode中定义的id一致
				style: edge.style,
			};
		});

		// 3. 设置节点到dagre
		for (const node of basicNodes) {
			dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
		}

		// 4. 设置边到dagre
		for (const edge of basicEdges) {
			dagreGraph.setEdge(edge.source, edge.target);
		}

		// 5. 计算布局
		dagre.layout(dagreGraph);

		// 6. 根据方向设置连接点位置
		const isHorizontalFlow = direction === 'LR' || direction === 'RL';

		// 7. 应用位置
		const positionedNodes = basicNodes.map(node => {
			const dagreNode = dagreGraph.node(node.id);
			
			return {
				...node,
				// 从dagre获取位置并居中
				position: {
					x: dagreNode.x - nodeWidth / 2,
					y: dagreNode.y - nodeHeight / 2,
				},
				// 设置连接点位置
				sourcePosition: isHorizontalFlow ? Position.Right : Position.Bottom,
				targetPosition: isHorizontalFlow ? Position.Left : Position.Top,
			};
		});

		// 8. 更新状态
		// @ts-expect-error - 类型兼容性问题
		setNodes(positionedNodes);
		// @ts-expect-error - 类型兼容性问题
		setEdges(basicEdges);
	}, [dagData, setNodes, setEdges]);

	// 当数据变化时重新计算布局
	useEffect(() => {
		// 获取布局方向
		let direction = 'TB'; // 默认自上而下
		if (dagData?.layoutDirection) {
			direction = dagData.layoutDirection;
		}
		
		applyLayout(direction);
	}, [dagData, applyLayout]);

	// 处理方向切换
	const handleDirectionChange = (direction: string) => {
		applyLayout(direction);
	};

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
				defaultEdgeOptions={{
					style: { strokeWidth: 2, stroke: '#64748b' },
					animated: true
				}}
			>
				<Controls 
					position="bottom-right"
					className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-1"
					showInteractive={false}
				/>
				<MiniMap 
					nodeStrokeWidth={3}
					position="top-right"
					className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg"
					nodeColor={() => '#3b82f6'}
					maskColor="rgba(240, 240, 245, 0.4)"
				/>
				<Background 
					color="#3b82f6" 
					gap={20} 
					size={1}
				/>
				<Panel position="top-left">
					<div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-2">
						<span className="w-3 h-3 bg-blue-500 rounded-full inline-block" />
						<span className="text-gray-700 dark:text-gray-300">节点数量: {nodes.length}</span>
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
							<span>自上而下</span>
						</button>
						<button 
							type="button"
							onClick={() => handleDirectionChange('LR')}
							className="px-3.5 py-2 bg-gray-500 text-white rounded-md text-sm shadow-md hover:bg-gray-600 transition-colors duration-300 flex items-center space-x-1.5"
						>
							<span className="text-lg">➡️</span>
							<span>从左到右</span>
						</button>
					</div>
				</Panel>
			</ReactFlow>
		</div>
	);
}

// 包装组件，提供React Flow的上下文
export default function DAGVisualization(props: DAGVisualizationProps) {
	return (
		<ReactFlowProvider>
			<DAGVisualizationFlow {...props} />
		</ReactFlowProvider>
	);
} 