# 任务 DAG 可视化与聊天工具

这是一个基于 Next.js 和 OpenAI 的任务 DAG（有向无环图）可视化与聊天工具。该工具可以帮助用户将复杂任务拆解为清晰的步骤流程，并以图形化方式展示任务之间的依赖关系。

## 功能特点

- 💬 聊天式界面：通过自然语言描述任务需求
- 📊 DAG 可视化：自动生成任务依赖图并支持交互
- 🤖 AI 助手：内置多个 AI 角色，提供不同类型的规划帮助
- 🌙 暗色模式：支持浅色/深色主题切换

## 快速开始

### 前置要求

- Node.js 18.0.0 或更高版本
- pnpm 8.0.0 或更高版本

### 环境设置

1. 复制环境变量示例文件

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的 OpenAI API 密钥和其他配置

```
OPENAI_API_KEY="你的OpenAI API密钥"
```

### 安装与运行

1. 安装依赖

```bash
pnpm install
```

2. 启动开发服务器

```bash
pnpm dev
```

3. 在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用

## 使用指南

1. 在右侧聊天框中描述你的任务需求，例如："帮我规划一下三月份的市场推广活动"
2. AI 将分析你的需求，并生成相应的任务依赖图
3. 你可以在 DAG 可视化区域查看任务流程，并切换不同的布局方向
4. 你可以在顶部切换不同的 AI 角色，获取不同视角的规划建议

## 技术栈

- [Next.js](https://nextjs.org/) - React 框架
- [Vercel AI SDK](https://github.com/vercel/ai) - AI 功能集成
- [ReactFlow](https://reactflow.dev/) - 流程图可视化
- [Tailwind CSS](https://tailwindcss.com/) - 样式设计
- [OpenAI API](https://openai.com/blog/openai-api) - 生成式 AI 模型

## 部署

你可以将项目部署到 Vercel 平台：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourname%2Fai-team)

别忘了在部署环境中设置所需的环境变量。
