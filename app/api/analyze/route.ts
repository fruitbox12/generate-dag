// ───────────────────────────────────────────────────────────────────────────────
// src/app/api/ai/route.ts
// Fully-self-contained Next-JS (app-router) API route for DAG generation
// ───────────────────────────────────────────────────────────────────────────────

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, type CoreMessage } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createDefaultDAG,
  type DAGData,
  type DAGEdge,
  HandlePosition,
  LayoutDirection,
} from '../../models/dag';
// put near the top of route.ts
function idBase(id: string | undefined) {
  return id?.split('_')[0]?.toLowerCase() ?? '';
}

/* ─── Runtime-cached node catalog ──────────────────────────────────────────── */
type NodeMeta = { name: string; label: string; type: string };
let catalogCache: NodeMeta[] | null = null;

async function getNodeCatalog(): Promise<NodeMeta[]> {
  if (catalogCache) return catalogCache;

  const url =
    'https://raw.githubusercontent.com/weave-services/node-assets/refs/heads/main/node-list/nodes.json';

  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok)
    throw new Error(`Unable to fetch node catalog (${res.status} ${res.statusText})`);

  catalogCache = (await res.json()) as NodeMeta[];
  return catalogCache;
}

/* ─── Tiny logger ──────────────────────────────────────────────────────────── */
const logger = {
  info:    (m: string) => console.log(`\x1b[36m[INFO]\x1b[0m ${m}`),
  success: (m: string) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${m}`),
  warn:    (m: string) => console.log(`\x1b[33m[WARNING]\x1b[0m ${m}`),
  error:   (m: string) => console.log(`\x1b[31m[ERROR]\x1b[0m ${m}`),
  debug:   (m: string, d?: unknown) => {
    console.log(`\x1b[35m[DEBUG]\x1b[0m ${m}`);
    if (d) console.log(`\x1b[35m${JSON.stringify(d, null, 2)}\x1b[0m`);
  },
};

/* ─── Request body ─────────────────────────────────────────────────────────── */
interface RequestBody {
  messages: { role: string; content: string }[];
}

/* ─── OpenAI client ────────────────────────────────────────────────────────── */
const openai = createOpenAI({
  apiKey:  process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE,
});

/* ─── Long system prompt (unchanged) ───────────────────────────────────────── */
/* ─── Long system prompt (verbatim) ─────────────────────────────────────────── */
const systemPrompt = `You are to always follow the users instructions You are a professional expert and Software Engineer in task analysis and visualization, specializing in breaking down complex requirements into a Directed Acyclic Graph (DAG) structure.

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

- A nodes array: includes each subtask node, where each node has id, type, and data attributes.
- An edges array: defines connections between nodes, where each edge includes id, source, target, animated, type, sourceHandle, and targetHandle attributes.
- A layoutDirection set to "LR" to achieve left-to-right layout.

Very important:

Ensure every edge contains sourceHandle and targetHandle properties, with values set to "right" and "left" respectively.

Set each node’s sourcePosition to "right" and targetPosition to "left".

Set layoutDirection to "LR".`;
/* ─── Constants ────────────────────────────────────────────────────────────── */
const START_NODE_TYPES = new Set(['trigger', 'webhook', 'scheduler']);

/* ─── generateDAG tool ─────────────────────────────────────────────────────── */
const tools = {
  generateDAG: tool({
    description: 'Generate a full DAG structure.',
    parameters: z.object({
      dagStructure: z.object({
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            data: z.object({
              label: z.string(),
              description: z.string().optional(),
            }),
            position: z.object({ x: z.number(), y: z.number() }).optional(),
            sourcePosition: z.string().optional(),
            targetPosition: z.string().optional(),
          }),
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
            style: z
              .object({ strokeWidth: z.number(), stroke: z.string() })
              .optional(),
          }),
        ),
        layoutDirection: z.string().optional(),
      }),
    }),
    execute: async ({ dagStructure }): Promise<DAGData> => {
      logger.info('📊 DAG structure received from model');
      const catalog = await getNodeCatalog();

      /* 1️⃣  Validate first node */
      const firstId   = dagStructure.nodes[0]?.id;
      const firstBase = idBase(firstId);
      const first     = catalog.find((n) => n.name.toLowerCase() === firstBase);
      
      if (!first || !START_NODE_TYPES.has(first.type)) {
         logger.error('❌ First node invalid, sending fallback DAG');
         return createDefaultDAG();
       }

      /* 2️⃣  Sanitize nodes */
      const cleanedNodes = dagStructure.nodes.map((n, i) => ({
        ...n,
        sourcePosition: HandlePosition.RIGHT,
        targetPosition: i === 0 ? undefined : HandlePosition.LEFT,
        data: {
          ...n.data,
          sourcePosition: HandlePosition.RIGHT,
          targetPosition: i === 0 ? undefined : HandlePosition.LEFT,
        },
      }));

      /* 3️⃣  Sanitize edges (⬅ this line was changed) */
      const cleanedEdges: DAGEdge[] = dagStructure.edges.map((e) => ({
        ...e,
        sourceHandle: 'right' as const,
        targetHandle: 'left'  as const,
      })) as DAGEdge[];

      const cleanDAG: DAGData = {
        ...dagStructure,
        nodes: cleanedNodes,
        edges: cleanedEdges,
        layoutDirection:
          (dagStructure.layoutDirection as LayoutDirection) ??
          LayoutDirection.LEFT_TO_RIGHT,
      };

      logger.success(
        `✅ Sanitised DAG: ${cleanedNodes.length} nodes / ${cleanedEdges.length} edges`,
      );
      return cleanDAG;
    },
  }),
};

/* ─── POST handler ─────────────────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    logger.info('🔄 POST /api/ai');
    const body = (await request.json()) as RequestBody;
    if (!body.messages?.length) throw new Error('Invalid message array');

    const catalog = await getNodeCatalog();
    const catalogText = JSON.stringify(
      catalog.map(({ name, label, type }) => ({ name, label, type })),
      null,
      2,
    );

    const aiMessages: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'system',
        content: `
You may ONLY reference nodes in the catalog below.
**The first node must be type “trigger”, “webhook”, or “scheduler”.**

Catalog:
${catalogText}`.trim(),
      },
      ...body.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
      messages: aiMessages,
      maxSteps: 5,
      temperature: 0,
      tools,
    });

    logger.success('✅ Streaming response');
    return result.toDataStreamResponse({
      getErrorMessage: (e) =>
        e instanceof Error ? `Tool execution error: ${e.message}` : 'Unknown error',
    });
  } catch (err) {
    logger.error('❌ Request failed');
    logger.debug('Error details', err);
    throw err;
  }
}
