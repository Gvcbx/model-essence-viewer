import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Download, Upload, Package, FileArchive, Trash2, Plus } from 'lucide-react';
import { RESArchiveBuilder, RESArchiveReader, type RESFileEntry } from '@/utils/resFormat';

interface RESManagerProps {
  onMEFFilesLoaded?: (files: RESFileEntry[]) => void;
}

export const RESManager = ({ onMEFFilesLoaded }: RESManagerProps) => {
  const [resFiles, setResFiles] = useState<RESFileEntry[]>([]);
  const [mefFiles, setMefFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [archiveName, setArchiveName] = useState('models');

  // Handle RES file upload and extraction
  const handleRESUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const buffer = await file.arrayBuffer();
      const reader = new RESArchiveReader();
      const archive = reader.parse(buffer);
      
      // Filter MEF files
      const mefFiles = archive.files.filter(f => 
        f.name.toLowerCase().endsWith('.mef') || 
        f.name.toLowerCase().endsWith('.ef')
      );
      
      setResFiles(archive.files);
      setProgress(100);
      
      toast.success(`RES archive loaded: ${archive.files.length} files (${mefFiles.length} MEF models)`);
      
      if (onMEFFilesLoaded) {
        onMEFFilesLoaded(mefFiles);
      }
    } catch (error: any) {
      toast.error(`Failed to parse RES archive: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle MEF files upload for packing
  const handleMEFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const mefFileList = files.filter(f => 
      f.name.toLowerCase().endsWith('.mef') || 
      f.name.toLowerCase().endsWith('.ef')
    );
    
    setMefFiles(prev => [...prev, ...mefFileList]);
    toast.success(`Added ${mefFileList.length} MEF files to pack list`);
  };

  // Create RES archive from MEF files
  const createRESArchive = async () => {
    if (mefFiles.length === 0) {
      toast.error('No MEF files to pack');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const builder = new RESArchiveBuilder();
      
      // Add all MEF files to the archive
      for (let i = 0; i < mefFiles.length; i++) {
        const file = mefFiles[i];
        const buffer = await file.arrayBuffer();
        
        // Use filename as it is, RESArchiveBuilder will add LOCAL: prefix if needed
        builder.addFile(file.name, buffer);
        
        setProgress(((i + 1) / mefFiles.length) * 90);
      }

      const archiveBuffer = builder.build();
      setProgress(100);

      // Download the created RES archive
      const blob = new Blob([archiveBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${archiveName}.res`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`RES archive created: ${archiveName}.res (${mefFiles.length} files)`);
    } catch (error: any) {
      toast.error(`Failed to create RES archive: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove MEF file from pack list
  const removeMEFFile = (index: number) => {
    setMefFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Download individual file from RES
  const downloadFile = (file: RESFileEntry) => {
    const blob = new Blob([file.data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace('LOCAL:', '');
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="w-5 h-5" />
          RES Archive Manager
        </CardTitle>
        <CardDescription>
          Extract MEF models from RES archives or create new RES files for IGI2
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="extract" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="extract">Extract RES</TabsTrigger>
            <TabsTrigger value="create">Create RES</TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="res-upload">Upload RES Archive</Label>
              <Input
                id="res-upload"
                type="file"
                accept=".res"
                onChange={handleRESUpload}
                disabled={isProcessing}
              />
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Label>Processing RES Archive...</Label>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {resFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Extracted Files ({resFiles.length})</Label>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                  {resFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm font-mono truncate">
                        {file.name.replace('LOCAL:', '')}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {(file.data.byteLength / 1024).toFixed(1)}KB
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadFile(file)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="archive-name">Archive Name</Label>
              <Input
                id="archive-name"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="Enter archive name (without .res extension)"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="mef-upload">Add MEF Files</Label>
              <Input
                id="mef-upload"
                type="file"
                accept=".mef,.ef"
                multiple
                onChange={handleMEFUpload}
                disabled={isProcessing}
              />
            </div>

            {mefFiles.length > 0 && (
              <div className="space-y-2">
                <Label>MEF Files to Pack ({mefFiles.length})</Label>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                  {mefFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm font-mono truncate">
                        {file.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)}KB
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMEFFile(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <Label>Creating RES Archive...</Label>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button
              onClick={createRESArchive}
              disabled={mefFiles.length === 0 || isProcessing}
              className="w-full"
            >
              <Package className="w-4 h-4 mr-2" />
              Create RES Archive
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};