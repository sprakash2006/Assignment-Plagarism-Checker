import { useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFilesProcessed: (files: Array<{ id: string; name: string; content: string }>) => void;
  maxFiles?: number;
}

export function FileUploader({ onFilesProcessed, maxFiles = 10 }: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter(file => file.type === 'application/pdf' || file.type === 'text/plain')
      .slice(0, maxFiles);
    
    setFiles(prev => [...prev, ...droppedFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, maxFiles);
      setFiles(prev => [...prev, ...selectedFiles].slice(0, maxFiles));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        // For PDFs, extract text using pdfjs-dist; for txt, just read text
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          try {
            // dynamic import of pdfjs; editors/TS may not find types for the legacy build
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
            // Ensure worker is set up correctly (pdfjs-dist bundlers may require setting workerSrc)
            // Use the worker included with pdfjs-dist from node_modules
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.js', import.meta.url).toString();

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let p = 1; p <= pdf.numPages; p++) {
              // eslint-disable-next-line no-await-in-loop
              const page = await pdf.getPage(p);
              // eslint-disable-next-line no-await-in-loop
              const txt = await page.getTextContent();
              const pageText = txt.items.map((it: any) => (it.str || '')).join(' ');
              fullText += '\n' + pageText;
            }

            return {
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              content: fullText
            };
          } catch (err) {
            // Fallback to raw text if pdf parsing fails
            const content = await file.text();
            return {
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              content
            };
          }
        }

        const content = await file.text();
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          content: content
        };
      })
    );
    
    onFilesProcessed(processedFiles);
  };

  return (
    <Card className="p-8 bg-card">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border"
        )}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Upload Assignment Files</h3>
        <p className="text-muted-foreground mb-6">
          Drag & drop PDF or text files here, or click to browse
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Maximum {maxFiles} files
        </p>
        
        <input
          type="file"
          multiple
          accept=".pdf,.txt"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="default" className="cursor-pointer" asChild>
            <span>Select Files</span>
          </Button>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="font-semibold mb-3">Selected Files ({files.length}/{maxFiles})</h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-secondary rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button
            onClick={processFiles}
            className="w-full mt-4"
            size="lg"
            disabled={files.length < 2}
          >
            Analyze {files.length} Documents
          </Button>
        </div>
      )}
    </Card>
  );
}
