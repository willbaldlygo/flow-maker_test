import { memo, useState, useEffect } from 'react';
import { Card } from './ui/card';

export interface SettingsData {
  llamaCloudApiKey: string;
  defaultLLM: string;
  apiKeys: {
    openai: string;
    anthropic: string;
    google: string;
  };
}

export const defaultSettings: SettingsData = {
  llamaCloudApiKey: '',
  defaultLLM: 'gpt-4o',
  apiKeys: {
    openai: '',
    anthropic: '',
    google: ''
  }
};

interface AgentBuilderSettingsProps {
  settings: SettingsData;
  onUpdateSettings: (settings: SettingsData) => void;
}

const AgentBuilderSettings = memo(({ settings, onUpdateSettings }: AgentBuilderSettingsProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <Card className="p-3 space-y-4">
        <div className="text-sm text-muted-foreground">
            API keys have been configured on the server. No action is needed here.
        </div>
    </Card>
  );
});

AgentBuilderSettings.displayName = 'AgentBuilderSettings';

export default AgentBuilderSettings;
