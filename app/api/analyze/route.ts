import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, type CoreMessage } from 'ai';
import type { NextRequest } from "next/server";
import { z } from 'zod';
import { createDefaultDAG, type DAGData } from '../../models/dag';

// 日志颜色工具函数
const logger = {
  info: (msg: string) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warn: (msg: string) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
  error: (msg: string) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  debug: (msg: string, data?: unknown) => {
    console.log(`\x1b[35m[DEBUG]\x1b[0m ${msg}`);
    if (data) {
      try {
        console.log(`\x1b[35m${JSON.stringify(data, null, 2)}\x1b[0m`);
      } catch {
        console.log(`\x1b[35m${String(data)}\x1b[0m`);
      }
    }
  }
};

// 定义从客户端发送的请求体类型
interface RequestBody {
  messages: { role: string; content: string }[];
  prompt?: string;
}

// 创建自定义OpenAI提供者
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE,
});

// 系统提示词，指导AI生成任务分析
const systemPrompt = `You are a professional expert in task analysis and visualization, specializing in breaking down complex requirements into a Directed Acyclic Graph (DAG) structure.

When a user describes a task or requirement, you need to analyze it and generate a clear DAG data structure that includes the following:

Break the task into different nodes, where each node represents a subtask.

Establish dependencies between nodes using edges to indicate execution order and dependencies.

Add appropriate descriptive labels to each node.

All nodes should use the unified type "default"; there is no need to distinguish between start/process/decision/end types anymore.

However, in the generated structure, you must ensure the following:

Each node must have a clear id and label property.

Nodes may optionally include a description property for more detailed explanation.

All edges must include sourceHandle and targetHandle properties, with values being one of "top", "right", "bottom", or "left".

Edge type should be set to "smoothstep", and animated should be set to true to enhance visual effects.

You must use the generateDAG tool to generate and return the complete DAG structure, including both node and edge information.

Use a structured object format; do not generate a JSON string.

The generated object should contain:

A nodes array: includes each subtask node, where each node has id, type, and data attributes.

An edges array: defines connections between nodes, where each edge includes id, source, target, animated, type, sourceHandle, and targetHandle attributes.

A layoutDirection set to "TB" to achieve top-to-bottom layout.

Very important:

Ensure every edge contains sourceHandle and targetHandle properties, with values set to "bottom" and "top" respectively.

Set each node’s sourcePosition to "bottom" and targetPosition to "top".

Set layoutDirection to "TB".`;

// 定义工具
const tools = {
  generateDAG: tool({
    description: '生成任务DAG数据结构，包含节点和边的完整信息',
    parameters: z.object({
      dagStructure: z.object({
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            data: z.object({
              label: z.string(),
              description: z.string().optional()
            }),
            position: z.object({
              x: z.number(),
              y: z.number()
            }).optional(),
            sourcePosition: z.string().optional(),
            targetPosition: z.string().optional()
          })
        ),
        edges: z.array(
          z.object({
            id: z.string(),
            source: z.string(),
            target: z.string(),
            animated: z.boolean(),
            type: z.string(),
            sourceHandle: z.string().optional(),
            targetHandle: z.string().optional(),
            style: z.object({
              strokeWidth: z.number(),
              stroke: z.string()
            }).optional()
          })
        ),
        layoutDirection: z.string().optional()
      }).describe('完整的DAG数据结构，包含节点和边的信息，节点使用通用类型，边需要有sourceHandle和targetHandle属性')
    }),
    execute: async ({ dagStructure }): Promise<DAGData> => {
      logger.info('📊 收到AI生成的DAG数据结构');
      try {
        // 直接使用对象，不再需要解析
        logger.debug('接收到DAG结构数据', dagStructure);
        const dagData = dagStructure as DAGData;
        
        logger.success(`✅ 解析成功: ${dagData.nodes.length}个节点, ${dagData.edges.length}个边`);
        logger.debug('节点数据:', dagData.nodes);
        logger.debug('边数据:', dagData.edges);
        
        return dagData;
      } catch (error) {
        logger.error('❌ 处理DAG结构失败:');
        logger.debug('错误详情:', error);
        logger.warn('返回默认DAG结构作为备选');
        
        // 返回默认DAG结构作为备选
        return createDefaultDAG();
      }
    },
  }),
};

export async function POST(request: NextRequest) {
  try {
    logger.info('🔄 收到POST请求');
    const body = await request.json() as RequestBody;
    
    // 获取聊天消息
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error('无效的消息格式');
    }
    
    logger.info(`📝 处理消息: ${body.messages.length}条`);
    logger.debug('消息内容:', body.messages);
    
    // 将消息转换为CoreMessage格式
    const coreMessages: CoreMessage[] = body.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));
    
    logger.info('🤖 开始调用OpenAI模型生成回复...');
    // 使用Vercel AI SDK的streamText函数处理请求
    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
      system: systemPrompt,
      messages: coreMessages,
      maxSteps: 5,
      temperature: 0, // 降低随机性，使结果更可预测
      tools,
    });

    logger.success('✅ 响应流创建成功，开始向客户端返回数据');
    
    // 将结果转换为数据流响应
    return result.toDataStreamResponse({
      // 处理错误消息
      getErrorMessage: (error) => {
        logger.error('❌ 工具调用错误:');
        logger.debug('错误详情:', error);
        
        if (error instanceof Error) {
          return `工具执行出错: ${error.message}`;
        }
        return '处理请求时出错';
      }
    });
  } catch (error) {
    logger.error('❌ 分析任务时出错:');
    logger.debug('错误详情:', error);
    throw error;
  }
} 
