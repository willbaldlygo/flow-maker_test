"use client";
import { useState } from "react";
import AgentFlow from "@/components/AgentFlow";
import RunView from "@/components/RunView";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Sidebar } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/use-mobile";

export default function IndexPage() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'edit' | 'run'>('edit');

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
          variant={activeTab === 'run' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('run')}
          className="rounded-none h-full"
        >
          Run
        </Button>
      </div>

      {/* Tab Content */}
      <div style={{ height: 'calc(100vh - 3rem)' }}>
        {activeTab === 'edit' ? <AgentFlow /> : <RunView />}
      </div>
      <Toaster />
    </div>
  );
}
