"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ItemNode } from "@/components/graph/ItemNode";
import { layoutWithDagre } from "@/lib/graph/layout-dagre";
import type { ItemFlowNode, RecipeFlowEdge } from "@/lib/graph/types";

const nodeTypes: NodeTypes = {
  item: ItemNode,
};

export interface ProgressionGraphProps {
  nodes: ItemFlowNode[];
  edges: RecipeFlowEdge[];
  className?: string;
}

function FitViewWhenReady({ depKey }: { depKey: string }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!depKey) return;
    const id = requestAnimationFrame(() => {
      void fitView({ padding: 0.18, duration: 200 });
    });
    return () => cancelAnimationFrame(id);
  }, [depKey, fitView]);

  return null;
}

function ProgressionGraphInner({
  nodes,
  edges,
  className,
}: ProgressionGraphProps) {
  const layoutedNodes = useMemo(
    () => layoutWithDagre(nodes, edges),
    [nodes, edges],
  );

  const fitKey = `${layoutedNodes.length}:${edges.length}`;

  if (layoutedNodes.length === 0) {
    return (
      <div
        className={`flex h-full min-h-[320px] items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 text-sm text-zinc-400 ${className ?? ""}`}
      >
        Search for a goal item to view its craft tree.
      </div>
    );
  }

  return (
    <div className={`h-full min-h-[400px] w-full ${className ?? ""}`}>
      <ReactFlow
        nodes={layoutedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { stroke: "#71717a", strokeWidth: 1.5 },
        }}
      >
        <Background gap={20} size={1} color="#3f3f46" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => (node.data?.depth === 0 ? "#fbbf24" : "#52525b")}
          maskColor="rgb(9, 9, 11, 0.75)"
          className="!bg-zinc-900"
        />
        <FitViewWhenReady depKey={fitKey} />
      </ReactFlow>
    </div>
  );
}

export function ProgressionGraph(props: ProgressionGraphProps) {
  return (
    <ReactFlowProvider>
      <ProgressionGraphInner {...props} />
    </ReactFlowProvider>
  );
}
