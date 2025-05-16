'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import DAGVisualization from './components/DAGVisualization';
import AITeamList from './components/AITeamList';
import type { DAGData } from './models/dag';
import type { AITeamMember } from './components/AITeamList';

export default function Home() {
  const [dagData, setDagData] = useState<DAGData | null>(null);
  
  // 可选：添加活跃AI成员状态，为将来扩展做准备
  const [activeAIMember, setActiveAIMember] = useState<string>('1'); // User是默认角色，ID为1

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

  // 处理选择AI团队成员事件
  const handleSelectTeamMember = (member: AITeamMember) => {
    setActiveAIMember(member.id);
    logger.info(`选择了AI团队成员: ${member.name} (ID: ${member.id}), 当前活跃ID: ${activeAIMember}`);
    // 这里可以添加更多逻辑，例如切换AI角色等
  };

  // 使用useChat钩子，处理聊天和工具调用
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/analyze',
    initialInput: 'Please help me book a flight for March 15.',
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
                
                if (dagStructure) {
                  logger.success('🎨 DAG数据处理完成，准备更新视图');
                  logger.debug('最终DAG数据', dagStructure);
                  // 直接设置DAG数据
                  setDagData(dagStructure);
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
    <main className="flex flex-col h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 注意：已移除标题栏 */}
      
      {/* 主体内容区 - 使用flex-1自动填充剩余空间 */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-4 md:p-6 gap-4 md:gap-6">
        {/* 左侧：DAG可视化 - 占据更大空间 */}
        <div className="w-full md:w-2/3 h-full overflow-hidden">
          <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
            {dagData ? (
              <div className="h-full w-full">
                <DAGVisualization dagData={dagData} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
                <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-center font-medium mb-2">Please enter a task description to generate a DAG visualization.</p>
                <p className="text-sm text-center text-gray-400 dark:text-gray-500 max-w-md">
                Describe your task requirements in the chat box on the right, and the AI will generate a task dependency graph for you                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧：聊天界面 */}
        <div className="w-full md:w-1/3 h-full flex flex-col">
          <div className="flex flex-col h-full w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
            {/* AI团队列表 - 新增 */}
            <AITeamList onSelectTeamMember={handleSelectTeamMember} activeId={activeAIMember} />
            
            {/* 消息显示区域 */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`animate-fadeIn ${
                    message.role === 'user'
                      ? 'flex justify-end'
                      : 'flex justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none shadow-sm'
                        : 'bg-white dark:bg-gray-800 shadow-md rounded-bl-none border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1 flex items-center">
                      {message.role === 'user' ? (
                        <span className="flex items-center">
                          <span className="mr-1">👤</span> User
                        </span> 
                      ) : (
                        <span className="flex items-center">
                          <span className="mr-1">🤖</span> AI
                        </span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    
                    {/* 更紧凑的消息详情 */}
                    {message.role === 'assistant' && (
                      <details className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-1.5 rounded">
                        <summary className="cursor-pointer hover:text-blue-500 transition-colors duration-200">Message Details








</summary>
                        <div className="mt-1 max-h-40 overflow-y-auto">
                          <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded">
                            {JSON.stringify(message, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
              
              {/* 加载状态指示器 */}
              {isLoading && (
                <div className="flex justify-center items-center py-6">
                  <div className="animate-pulse flex space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  </div>
                </div>
              )}
            </div>
            
            {/* 输入区域，固定在底部 */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Enter task description







..."
                  className="flex-grow px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-5 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  <span>Send</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
