"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateWorkflowJson } from '@/lib/workflow-compiler';
import { generateTypescript } from '@/lib/typescript-compiler';
import { Node, Edge } from '@xyflow/react';

interface CompileViewProps {
    nodes: Node[];
    edges: Edge[];
}

const CompileView = ({ nodes, edges }: CompileViewProps) => {
  const [generatedCode, setGeneratedCode] = useState<string | null>("// Click 'Compile' to generate the workflow code");
  const [isDebug, setIsDebug] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsDebug(searchParams.get('debug') === '1');
  }, [searchParams]);

  const onCompile = () => {
    const workflowJson = generateWorkflowJson(nodes, edges);
    if (workflowJson) {
      const tsCode = generateTypescript(workflowJson);
      setGeneratedCode(tsCode);
    } else {
        setGeneratedCode("// Could not generate workflow. Make sure you have a Start node.");
    }
  };

  const onShowIntermediate = () => {
    const workflowJson = generateWorkflowJson(nodes, edges);
    if (workflowJson) {
        setGeneratedCode(JSON.stringify(workflowJson, null, 2));
    } else {
        setGeneratedCode("// Could not generate workflow. Make sure you have a Start node.");
    }
  }

  const handleDownload = () => {
    if (generatedCode) {
      const blob = new Blob([generatedCode], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workflow.ts';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-full flex">
      <div className="w-80 bg-card border-r border-border p-4 flex flex-col space-y-4">
        <h2 className="text-xl font-semibold">Compile Workflow</h2>
        <p className='text-sm text-muted-foreground'>
            Click the compile button to generate the TypeScript code for your workflow.
            You can then download the file and run it.
        </p>
        <Button onClick={onCompile}>Compile</Button>
        {isDebug && <Button onClick={onShowIntermediate}>Intermediate</Button>}
        <Button onClick={handleDownload} disabled={!generatedCode || generatedCode.startsWith("//")}>Download</Button>
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full bg-card border rounded-md overflow-auto">
            <SyntaxHighlighter 
                language="typescript" 
                style={vs} 
                showLineNumbers 
                className="h-full"
                wrapLongLines={true}
                customStyle={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {generatedCode || ''}
            </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

export default CompileView; 
