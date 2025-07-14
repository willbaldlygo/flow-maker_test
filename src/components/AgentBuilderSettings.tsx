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

  // Get the current API key based on selected LLM
  const getCurrentApiKey = () => {
    switch (settings.defaultLLM) {
      case 'gpt-4o':
        return settings.apiKeys.openai;
      case 'claude-sonnet':
        return settings.apiKeys.anthropic;
      case 'gemini-2.5-pro':
        return settings.apiKeys.google;
      default:
        return '';
    }
  };

  // Update the current API key based on selected LLM
  const updateCurrentApiKey = (value: string) => {
    switch (settings.defaultLLM) {
      case 'gpt-4o':
        updateApiKey('openai', value);
        break;
      case 'claude-sonnet':
        updateApiKey('anthropic', value);
        break;
      case 'gemini-2.5-pro':
        updateApiKey('google', value);
        break;
    }
  };

  // Get the appropriate placeholder for the current LLM
  const getApiKeyPlaceholder = () => {
    switch (settings.defaultLLM) {
      case 'gpt-4o':
        return 'sk-...';
      case 'claude-sonnet':
        return 'sk-ant-...';
      case 'gemini-2.5-pro':
        return 'AI...';
      default:
        return 'Enter API key';
    }
  };

  // Get the provider name for the current LLM
  const getProviderName = () => {
    switch (settings.defaultLLM) {
      case 'gpt-4o':
        return 'OpenAI';
      case 'claude-sonnet':
        return 'Anthropic';
      case 'gemini-2.5-pro':
        return 'Google';
      default:
        return 'API';
    }
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

        {/* Dynamic API Key for Selected LLM */}
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
      </Card>
    </div>
  );
});

AgentBuilderSettings.displayName = 'AgentBuilderSettings';

export default AgentBuilderSettings;