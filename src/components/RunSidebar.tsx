import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RunSidebar = () => {
  const handleRun = () => {
    // TODO: Implement run functionality
    console.log('Running the agent graph...');
  };

  return (
    <div className="w-80 bg-card border-r border-border p-4">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">Run Mode</h2>
        </div>
        
        <Button 
          onClick={handleRun}
          className="w-full"
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          Run
        </Button>
        
        <div className="text-sm text-muted-foreground">
          Click "Run" to execute the agent graph.
        </div>
      </div>
    </div>
  );
};

export default RunSidebar;