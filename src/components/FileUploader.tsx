import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { parseMEFFile } from '@/utils/mefParser';

interface FileUploaderProps {
  onFileSelect: (file: File, modelData?: any) => void;
  acceptedTypes?: string[];
  maxSize?: number;
}

export const FileUploader = ({ 
  onFileSelect, 
  acceptedTypes = ['.mef', '.obj', '.fbx', '.gltf', '.glb'], 
  maxSize = 50 * 1024 * 1024 // 50MB
}: FileUploaderProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error('Unsupported file type');
      return;
    }

    const file = acceptedFiles[0];
    
    if (file.size > maxSize) {
      toast.error('File size too large');
      return;
    }

    setUploadedFile(file);
    setUploadStatus('uploading');

    try {
      let modelData = null;
      
      // Parse MEF files
      if (file.name.toLowerCase().endsWith('.mef')) {
        modelData = await parseMEFFile(file);
        toast.success(`MEF file parsed: ${modelData.meshes.length} meshes, ${modelData.totalVertices} vertices`);
      } else {
        // Simulate processing for other formats
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success(`File uploaded: ${file.name}`);
      }
      
      setUploadStatus('success');
      onFileSelect(file, modelData);
    } catch (error) {
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      toast.error(errorMessage);
    }
  }, [onFileSelect, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': acceptedTypes,
      'model/*': ['.obj', '.fbx', '.gltf', '.glb'],
    },
    multiple: false,
    maxSize
  });

  const clearFile = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success':
        return 'border-success/30 bg-success/10';
      case 'error':
        return 'border-destructive/30 bg-destructive/10';
      case 'uploading':
        return 'border-primary/30 bg-primary/10';
      default:
        return '';
    }
  };

  return (
    <Card className="p-6 bg-viewer-panel border-border/50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Upload Model File</h3>
          {uploadedFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              "hover:border-primary/50 hover:bg-primary/5",
              isDragActive && "border-primary bg-primary/10",
              "border-border/50 bg-viewer-control/30"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-sm">
                {isDragActive ? (
                  <p className="text-primary font-medium">Drop file here...</p>
                ) : (
                  <>
                    <p className="text-foreground font-medium">Drag MEF file here</p>
                    <p className="text-muted-foreground">or click to select</p>
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Supported types: {acceptedTypes.join(', ')}
              </div>
            </div>
          </div>
        ) : (
          <Card className={cn(
            "p-4 border transition-colors",
            getStatusColor()
          )}>
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {uploadStatus === 'uploading' && (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </Card>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Supports MEF files from IGI2 Covert Strike</p>
          <p>• Max file size: {Math.round(maxSize / 1024 / 1024)} MB</p>
          <p>• Other supported formats: OBJ, FBX, GLTF</p>
        </div>
      </div>
    </Card>
  );
};