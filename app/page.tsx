"use client";
import { useState } from "react";
import AgentFlow from "@/components/AgentFlow";
import RunView from "@/components/RunView";
import CompileView from "@/components/CompileView";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/use-mobile";
import { Node, Edge, useNodesState, useEdgesState, OnNodesChange, NodeChange } from '@xyflow/react';
import { initialNodes, initialEdges } from "@/lib/initial-graph";
import { SettingsData, defaultSettings } from "@/components/AgentBuilderSettings";

const getInitialNodes = () => {
    if (typeof window !== 'undefined') {
        const savedNodes = localStorage.getItem('agent-builder-nodes');
        if (savedNodes) {
            try {
                return JSON.parse(savedNodes);
            } catch (e) {
                console.error("Failed to parse saved nodes:", e);
            }
        }
    }
    return initialNodes;
}

const getInitialEdges = () => {
    if (typeof window !== 'undefined') {
        const savedEdges = localStorage.getItem('agent-builder-edges');
        if (savedEdges) {
            try {
                return JSON.parse(savedEdges);
            } catch (e) {
                console.error("Failed to parse saved edges:", e);
            }
        }
    }
    return initialEdges;
}

const getInitialSettings = () => {
    if (typeof window !== 'undefined') {
        const savedSettings = localStorage.getItem('agent-builder-settings');
        if (savedSettings) {
            try {
                return JSON.parse(savedSettings);
            } catch (e) {
                console.error("Failed to parse saved settings:", e);
            }
        }
    }
    return defaultSettings;
}

export default function IndexPage() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'edit' | 'compile' | 'run'>('edit');
  
  const [nodes, setNodes, onNodesChangeOriginal] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());
  const [settings, setSettings] = useState<SettingsData>(getInitialSettings());

  const onNodesChange: OnNodesChange = (changes) => {
    for (const change of changes) {
        if (change.type === 'remove') {
            const nodeToRemove = nodes.find(n => n.id === change.id);
            if (nodeToRemove && nodeToRemove.type === 'agentTool') {
                localStorage.removeItem(`agent-tool-config-${change.id}`);
            }
        }
    }
    onNodesChangeOriginal(changes);
  }


  return (
    <div className="h-screen w-full flex flex-col">
      {/* Tab Header */}
      <div className="flex border-b border-border bg-card h-12">
        <Button
          variant={activeTab === 'edit' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('edit')}
          className="rounded-none border-r border-border h-full"
        >
          Edit
        </Button>
        <Button
            variant={activeTab === 'compile' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('compile')}
            className="rounded-none border-r border-border h-full"
        >
            Compile
        </Button>
        <Button
          variant={activeTab === 'run' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('run')}
          className="rounded-none h-full"
        >
          Run
        </Button>
      </div>

      {/* Tab Content */}
      <div style={{ height: 'calc(100vh - 3rem)' }}>
        {activeTab === 'edit' && <AgentFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} setNodes={setNodes} setEdges={setEdges} settings={settings} setSettings={setSettings} />}
        {activeTab === 'compile' && <CompileView nodes={nodes} edges={edges} />}
        {activeTab === 'run' && <RunView />}
      </div>
      <Toaster />
    </div>
  );
}
