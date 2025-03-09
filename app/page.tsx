'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import DAGVisualization from './components/DAGVisualization';
import type { DAGData, DAGEdge } from './models/dag';
import { HandlePosition } from './models/dag';

export default function Home() {
  const [dagData, setDagData] = useState<DAGData | null>(null);

  // 前端日志工具
  const logger = {
    info: (msg: string, data?: unknown) => {
      console.log(`%c[INFO] ${msg}`, 'color: #0ea5e9; font-weight: bold;');
      if (data) console.log('%c📦 数据:', 'color: #0ea5e9;', data);
    },
    success: (msg: string, data?: unknown) => {
      console.log(`%c[SUCCESS] ${msg}`, 'color: #10b981; font-weight: bold;');
      if (data) console.log('%c✅ 数据:', 'color: #10b981;', data);
    },
    warn: (msg: string, data?: unknown) => {
      console.log(`%c[WARNING] ${msg}`, 'color: #f59e0b; font-weight: bold;');
      if (data) console.log('%c⚠️ 数据:', 'color: #f59e0b;', data);
    },
    error: (msg: string, data?: unknown) => {
      console.log(`%c[ERROR] ${msg}`, 'color: #ef4444; font-weight: bold;');
      if (data) console.log('%c❌ 错误:', 'color: #ef4444;', data);
    },
    debug: (msg: string, data?: unknown) => {
      console.log(`%c[DEBUG] ${msg}`, 'color: #8b5cf6; font-weight: bold;');
      if (data) console.log('%c🔍 数据:', 'color: #8b5cf6;', data);
    }
  };

  // 使用useChat钩子，处理聊天和工具调用
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/analyze',
    initialInput: '帮我定一下3月15号的机票',
    onFinish: (message) => {
      // 处理工具调用结果
      logger.info(`📨 消息完成: ${message.id}`);
      
      // 检查消息的parts属性中是否有工具调用
      if (message.parts) {
        logger.debug(`消息包含 ${message.parts.length} 个部分`, message.parts);
        
        for (const part of message.parts) {
          logger.debug(`处理消息部分类型: ${part.type}`);
          
          if (part.type === 'tool-invocation' && 
              part.toolInvocation && 
              part.toolInvocation.toolName === 'generateDAG') {
            
            logger.success('🎯 找到generateDAG工具调用!');
            logger.debug('完整工具调用对象', part.toolInvocation);
            
            // 使用args属性而不是input属性
            if (part.toolInvocation.args) {
              logger.debug('工具参数', part.toolInvocation.args);
              
              try {
                // 获取dagStructure参数
                const dagStructure = part.toolInvocation.args.dagStructure;
                logger.debug('原始DAG结构数据', dagStructure);
                
                // 直接使用对象，不再需要JSON解析
                if (dagStructure) {
                  // 处理边，确保有sourceHandle和targetHandle
                  const parsedData = dagStructure as DAGData;
                  if (parsedData.edges) {
                    parsedData.edges = parsedData.edges.map((edge: DAGEdge) => {
                      const enhancedEdge = {
                        ...edge,
                        sourceHandle: edge.sourceHandle || HandlePosition.BOTTOM,  // 默认使用底部位置作为源
                        targetHandle: edge.targetHandle || HandlePosition.TOP,     // 默认使用顶部位置作为目标
                      };
                      logger.debug(`边 ${edge.id} 处理完成`, enhancedEdge);
                      return enhancedEdge;
                    });
                    
                    logger.success('🎨 DAG数据处理完成，准备更新视图');
                    logger.debug('最终DAG数据', parsedData);
                    setDagData(parsedData);
                  } else {
                    logger.warn('DAG数据没有edges属性或为空');
                  }
                } else {
                  logger.warn('dagStructure为空');
                }
              } catch (error) {
                logger.error('解析DAG数据失败', error);
              }
            } else {
              logger.warn('工具调用缺少args属性', part.toolInvocation);
            }
            break;
          }
        }
      } else {
        logger.warn('消息没有parts属性', message);
      }
    },
  });

  return (
    <main className="flex flex-col h-screen w-full overflow-hidden">
      {/* 标题栏 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm py-3 px-6">
        <h1 className="text-2xl font-bold text-center">任务 DAG 可视化工具</h1>
      </header>
      
      {/* 主体内容区 - 使用flex-1自动填充剩余空间 */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* 左侧：DAG可视化 - 占据更大空间 */}
        <div className="w-full md:w-2/3 h-full overflow-hidden p-4">
          <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {dagData ? (
              <div className="h-full w-full">
                <DAGVisualization dagData={dagData} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                请输入任务描述，生成DAG可视化
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧：聊天界面 */}
        <div className="w-full md:w-1/3 h-full p-4 flex flex-col">
          <div className="flex flex-col h-full w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* 消息显示区域 */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900 ml-4'
                      : 'bg-gray-100 dark:bg-gray-700 mr-4'
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {message.role === 'user' ? '用户:' : 'AI:'}
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  
                  {/* 更紧凑的消息详情 */}
                  {message.role === 'assistant' && (
                    <details className="mt-2 text-xs text-gray-500">
                      <summary>消息详情</summary>
                      <div className="mt-1 max-h-40 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(message, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              ))}
              
              {/* 加载状态指示器 */}
              {isLoading && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                </div>
              )}
            </div>
            
            {/* 输入区域，固定在底部 */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="输入任务描述..."
                  className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发送
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
