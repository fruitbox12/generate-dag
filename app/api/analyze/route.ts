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
const systemPrompt = `你是一个专业的任务分析和可视化专家，擅长将复杂的需求拆解为有向无环图(DAG)结构。
当用户描述一个任务或需求时，你需要分析并生成一个清晰的DAG数据结构，包含以下内容：

1. 将任务拆分为不同的节点，每个节点代表一个子任务或决策点
2. 建立节点之间的依赖关系，用边来表示执行顺序和依赖
3. 为每个节点添加合适的描述和类型标签

节点类型包括：
- start: 起始节点，任务的开始
- process: 处理节点，代表一个具体的操作
- decision: 决策节点，代表需要做出选择的点
- end: 结束节点，任务的完成

你需要使用generateDAG工具来生成并返回完整的DAG结构，包含节点和边的信息。
使用结构化的对象格式，不要生成JSON字符串。确保生成的结构具有完整的sourceHandle和targetHandle属性，指定为"top"、"right"、"bottom"或"left"，以正确显示边的连接点。

例如，如果用户想要"预订一次旅行"，你应分析这个任务需要哪些步骤，它们之间如何依赖，并生成包含以下元素的结构：
- nodes数组：包含每个子任务的节点，每个节点有id、type、data属性
- edges数组：定义节点间连接，每个边有id、source、target、animated、type、sourceHandle、targetHandle属性

非常重要：确保每个边都包含sourceHandle和targetHandle属性，否则图表无法正确显示连接。`;

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
              description: z.string().optional(),
              type: z.string()
            }),
            position: z.object({
              x: z.number(),
              y: z.number()
            }).optional()
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
        )
      }).describe('完整的DAG数据结构，包含节点和边的信息，每个边应该有sourceHandle和targetHandle属性')
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