import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import RunView from '../RunView';
import * as workflowCompiler from '@/lib/workflow-compiler';
import type { Node, Edge } from '@xyflow/react';

vi.mock('@/lib/workflow-compiler', () => ({
  compileWorkflow: vi.fn(),
}));

describe('RunView', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<RunView />);
    expect(screen.getByText('Run')).toBeInTheDocument();
    expect(screen.getByText('Restart')).toBeInTheDocument();
  });

  it('calls compileWorkflow when Run button is clicked', () => {
    render(<RunView />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    expect(workflowCompiler.compileWorkflow).toHaveBeenCalled();
  });

  it('shows an error message if workflow compilation fails', () => {
    (workflowCompiler.compileWorkflow as Mock).mockReturnValue(null);
    render(<RunView />);
    
    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);
    
    expect(screen.getByText('Could not compile workflow. Make sure you have a Start node.')).toBeInTheDocument();
  });

  it('starts execution with the start node when compilation is successful', async () => {
    const reactFlowNodes: Node[] = [
      { id: 'start-1', type: 'start', data: {}, position: { x: 0, y: 0 } }
    ];
    const reactFlowEdges: Edge[] = [];

    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'agent-builder-nodes') return JSON.stringify(reactFlowNodes);
        if (key === 'agent-builder-edges') return JSON.stringify(reactFlowEdges);
        return null;
      }),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
    };
    
    vi.stubGlobal('localStorage', localStorageMock);

    const compiledWorkflow = {
      nodes: [
        { id: 'node-start-1', type: 'start', data: {}, emits: 'e-start-1' }
      ],
      edges: [],
      settings: {},
    };
    (workflowCompiler.compileWorkflow as Mock).mockReturnValue(compiledWorkflow);

    render(<RunView />);
    
    const startNodeElement = await screen.findByTestId('rf__node-start-1');

    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);

    await waitFor(() => {
        expect(startNodeElement).toHaveClass('glowing');
    });
  });
}); 
