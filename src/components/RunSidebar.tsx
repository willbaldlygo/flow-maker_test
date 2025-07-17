import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ChatInput,
  ChatMessages,
  ChatSection,
  Message,
  ChatHandler,
} from '@llamaindex/chat-ui';
import { type Message as VercelMessage } from 'ai/react';
import { Dispatch, SetStateAction, useState } from 'react';

interface RunSidebarProps {
  onRun: () => void;
  status: 'idle' | 'running' | 'pausedForInput' | 'finished' | 'error';
  onUserInput: (message: VercelMessage) => void;
  error: string | null;
  messages: VercelMessage[];
  setMessages: Dispatch<SetStateAction<VercelMessage[]>>;
}

const RunSidebar = ({
  onRun,
  status,
  onUserInput,
  error,
  messages,
  setMessages,
}: RunSidebarProps) => {
  const [input, setInput] = useState('');

  const chatHandler: ChatHandler = {
    messages: messages as Message[],
    input,
    setInput,
    isLoading:
      status === 'running' || status === 'finished' || status === 'error',
    append: async (message) => {
      const userMessage: VercelMessage = {
        ...message,
        id: Math.random().toString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      onUserInput(userMessage);
      return '';
    },
    reload: () => {},
    stop: () => {},
  };

  return (
    <div className="w-80 h-full flex flex-col bg-card border-r border-border p-4">
      <div className="space-y-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">Run Mode</h2>
        </div>
        <Button
          onClick={onRun}
          className="w-full"
          size="lg"
          disabled={status !== 'idle'}
        >
          <Play className="w-4 h-4 mr-2" />
          Run
        </Button>
        <div className="text-sm text-muted-foreground">
          Status: {status}
          {error && <div className="text-red-500">{error}</div>}
        </div>
      </div>
      <ChatSection handler={chatHandler}>
        <ChatMessages />
        <ChatInput>
          <ChatInput.Form>
            <ChatInput.Field
              placeholder={
                status === 'pausedForInput'
                  ? 'Please provide your input'
                  : 'Waiting for agent...'
              }
            />
            <ChatInput.Submit />
          </ChatInput.Form>
        </ChatInput>
      </ChatSection>
    </div>
  );
};

export default RunSidebar;
