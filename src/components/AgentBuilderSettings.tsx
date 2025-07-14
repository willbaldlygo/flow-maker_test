import { memo, useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Eye, EyeOff, Settings } from 'lucide-react';

interface SettingsData {
  llamaCloudApiKey: string;
  defaultLLM: string;
  apiKeys: {
    openai: string;
    anthropic: string;
    google: string;
  };
}

const defaultSettings: SettingsData = {
  llamaCloudApiKey: '',
  defaultLLM: 'gpt-4o',
  apiKeys: {
    openai: '',
    anthropic: '',
    google: ''
  }
};

const AgentBuilderSettings = memo(() => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [showApiKeys, setShowApiKeys] = useState({
    llamaCloud: false,
    openai: false,
    anthropic: false,
    google: false
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('agent-builder-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('agent-builder-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  const updateSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateApiKey = (provider: keyof SettingsData['apiKeys'], value: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider]: value
      }
    }));
  };

  const toggleApiKeyVisibility = (key: keyof typeof showApiKeys) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="mt-6">
      <div className="flex items-center space-x-2 mb-3">
        <Settings className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Settings</h3>
      </div>

      <Card className="p-3 space-y-4">
        {/* LlamaCloud API Key */}
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

        {/* Default LLM Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Default LLM</Label>
          <Select value={settings.defaultLLM} onValueChange={(value) => updateSetting('defaultLLM', value)}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Select default LLM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="claude-sonnet">Claude Sonnet</SelectItem>
              <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* API Keys for each model */}
        <div className="space-y-3 pt-2 border-t border-border">
          <Label className="text-xs font-medium text-muted-foreground">API Keys</Label>
          
          {/* OpenAI API Key */}
          <div className="space-y-1">
            <Label htmlFor="openai-key" className="text-xs">OpenAI</Label>
            <div className="relative">
              <Input
                id="openai-key"
                type={showApiKeys.openai ? "text" : "password"}
                value={settings.apiKeys.openai}
                onChange={(e) => updateApiKey('openai', e.target.value)}
                placeholder="sk-..."
                className="text-xs pr-8"
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

          {/* Anthropic API Key */}
          <div className="space-y-1">
            <Label htmlFor="anthropic-key" className="text-xs">Anthropic</Label>
            <div className="relative">
              <Input
                id="anthropic-key"
                type={showApiKeys.anthropic ? "text" : "password"}
                value={settings.apiKeys.anthropic}
                onChange={(e) => updateApiKey('anthropic', e.target.value)}
                placeholder="sk-ant-..."
                className="text-xs pr-8"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => toggleApiKeyVisibility('anthropic')}
              >
                {showApiKeys.anthropic ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Google API Key */}
          <div className="space-y-1">
            <Label htmlFor="google-key" className="text-xs">Google</Label>
            <div className="relative">
              <Input
                id="google-key"
                type={showApiKeys.google ? "text" : "password"}
                value={settings.apiKeys.google}
                onChange={(e) => updateApiKey('google', e.target.value)}
                placeholder="AI..."
                className="text-xs pr-8"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => toggleApiKeyVisibility('google')}
              >
                {showApiKeys.google ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

AgentBuilderSettings.displayName = 'AgentBuilderSettings';

export default AgentBuilderSettings;