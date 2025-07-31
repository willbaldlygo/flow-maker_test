import { memo, useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Eye, EyeOff, Settings } from 'lucide-react';

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
  const [showApiKeys, setShowApiKeys] = useState({
    llamaCloud: false,
    openai: false,
    anthropic: false,
    google: false
  });

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
      {/* // The following UI elements have been removed to use server-side environment variables instead.

      <div className="space-y-2">
        <Label htmlFor="llamacloud-key" className="text-xs font-medium">
          LlamaCloud API Key
        </Label>
        <div className="relative">
          <Input
            id="llamacloud-key"
            type={showApiKeys.llamaCloud ? "text" : "password"}
            value={settings.llamaCloudApiKey}
            onChange={(e) => updateSetting('llamaCloudApiKey', e.target.value)}
            placeholder="Enter LlamaCloud API key"
            className="text-xs pr-8"
            data-1p-ignore
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => toggleApiKeyVisibility('llamaCloud')}
          >
            {showApiKeys.llamaCloud ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Default LLM</Label>
        <Select value={settings.defaultLLM} onValueChange={(value) => updateSetting('defaultLLM', value)}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Select default LLM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">GPT 4.1</SelectItem>
            <SelectItem value="claude-sonnet">Claude Sonnet</SelectItem>
            <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="llm-api-key" className="text-xs font-medium">
          {getProviderName()} API Key
        </Label>
        <div className="relative">
          <Input
            id="llm-api-key"
            type={showApiKeys.openai ? "text" : "password"}
            value={getCurrentApiKey()}
            onChange={(e) => updateCurrentApiKey(e.target.value)}
            placeholder={getApiKeyPlaceholder()}
            className="text-xs pr-8"
            data-1p-ignore
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => toggleApiKeyVisibility('openai')}
          >
            {showApiKeys.openai ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
          </button>
        </div>
      </div> 
      
      */}
    </Card>
  );
});

AgentBuilderSettings.displayName = 'AgentBuilderSettings';

export default AgentBuilderSettings;
