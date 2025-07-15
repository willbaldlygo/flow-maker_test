import { useState } from "react";
import AgentFlow from "@/components/AgentFlow";
import RunView from "@/components/RunView";
import { Button } from "@/components/ui/button";

const Index = () => {
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
    </div>
  );
};

export default Index;
