import {
  ChatHandler,
  ChatUIProvider,
  useChatUI,
} from '@llamaindex/chat-ui';
import { useChat, type Message } from 'ai/react';
import { ReactNode } from 'react';

// Wrapper component to bridge ai/react's useChat with @llamaindex/chat-ui
function ChatProvider({ children }: { children: ReactNode }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  const chatHandler: ChatHandler = {
    messages: messages as Message[],
    input,
    setInput: (value: string) => {
      // Create a synthetic event to update the input
      const event = {
        target: { value },
      } as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(event);
    },
    isLoading,
    append: async (message) => {
      // Not a perfect mapping, but gets the job done
      await handleSubmit(
        new Event('submit') as unknown as React.FormEvent<HTMLFormElement>,
      );
      return '';
    },
    reload: () => {}, // Not implemented
    stop: () => {}, // Not implemented
  };

  return <ChatUIProvider handler={chatHandler}>{children}</ChatUIProvider>;
}

export { ChatProvider, useChatUI }; 
