'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { NetworkNode } from '@atline/types';
import AffiliateNode from './AffiliateNode';

const nodeTypes = { affiliate: AffiliateNode };

interface NetworkTreeProps {
  data: NetworkNode[];
}

// Convertit l'arbre hiérarchique en nodes/edges React Flow
function treeToFlow(
  nodes: NetworkNode[],
  parentId?: string,
  depth = 0,
  xOffset = 0
): { nodes: Node[]; edges: Edge[] } {
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];
  const SPACING_X = 200;
  const SPACING_Y = 120;

  nodes.forEach((node, i) => {
    const x = xOffset + i * SPACING_X;
    const y = depth * SPACING_Y;

    flowNodes.push({
      id: node.id,
      type: 'affiliate',
      position: { x, y },
      data: node as unknown as Record<string, unknown>,
    });

    if (parentId) {
      flowEdges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        style: { stroke: node.isActive ? '#10b981' : '#d1d5db', strokeWidth: 2 },
      });
    }

    if (node.children?.length) {
      const childResult = treeToFlow(
        node.children,
        node.id,
        depth + 1,
        x - (node.children.length - 1) * SPACING_X / 2
      );
      flowNodes.push(...childResult.nodes);
      flowEdges.push(...childResult.edges);
    }
  });

  return { nodes: flowNodes, edges: flowEdges };
}

export default function NetworkTree({ data }: NetworkTreeProps) {
  const { nodes: initialNodes, edges: initialEdges } = treeToFlow(data);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onInit = useCallback(() => {}, []);

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-gray-200 bg-[#f8fafc]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap
          nodeColor={(node) => (node.data as unknown as NetworkNode).isActive ? '#10b981' : '#d1d5db'}
          style={{ background: '#f1f5f9' }}
        />
        <Controls />
        <Background color="#e2e8f0" gap={20} />
      </ReactFlow>
    </div>
  );
}
