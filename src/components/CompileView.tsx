"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { compileWorkflow } from '@/lib/workflow-compiler';
import { generateTypescript } from '@/lib/typescript-compiler';
import { Node, Edge } from '@xyflow/react';
import { useToast } from './ui/use-toast';
import { Copy } from 'lucide-react';

interface CompileViewProps {
    nodes: Node[];
    edges: Edge[];
}

const CompileView = ({ nodes, edges }: CompileViewProps) => {
  const [generatedCode, setGeneratedCode] = useState<string | null>("// Click 'Compile' to generate the workflow code");
  const [isDebug, setIsDebug] = useState(false);
  const searchParams = useSearchParams();
  const [intermediateJson, setIntermediateJson] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsDebug(searchParams.get('debug') === '1');
  }, [searchParams]);

  const onCompile = () => {
    setIntermediateJson(null);
    const json = compileWorkflow(nodes, edges);
    if (json) {
      const code = generateTypescript(json);
      setGeneratedCode(code);
    } else {
        setGeneratedCode("// Could not generate workflow. Make sure you have a Start node.");
    }
  };

  const onShowIntermediate = () => {
    setIntermediateJson(null);
    setGeneratedCode(null);
    const json = compileWorkflow(nodes, edges);
    if (json) {
      const jsonString = JSON.stringify(json, null, 2);
      setIntermediateJson(jsonString);
    } else {
      setGeneratedCode("// Could not generate workflow. Make sure you have a Start node.");
    }
  }

  const handleCopy = () => {
    const textToCopy = intermediateJson || generatedCode;
    if (textToCopy && !textToCopy.startsWith("//")) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        toast({
          title: "Copied to clipboard!",
        });
      }, () => {
        toast({
          title: "Failed to copy to clipboard",
          variant: "destructive",
        });
      });
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
        <div className="relative h-full bg-card border rounded-md overflow-auto">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 h-8 w-8"
              onClick={handleCopy}
              disabled={!(intermediateJson || generatedCode) || (generatedCode !== null && generatedCode.startsWith("//"))}
            >
                <Copy className="h-4 w-4" />
            </Button>
            <SyntaxHighlighter 
                language={intermediateJson ? "json" : "typescript"} 
                style={vs} 
                showLineNumbers 
                className="h-full"
                wrapLongLines={true}
                customStyle={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            >
                {intermediateJson || generatedCode || ''}
            </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

export default CompileView; 
