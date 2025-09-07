import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { convertOBJFileToMEF } from '@/utils/objToMef';
import { useToast } from '@/components/ui/use-toast';

export function OBJConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedData, setConvertedData] = useState<ArrayBuffer | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.obj')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid OBJ file.",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
      setConvertedData(null);
      setProgress(0);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const mefBuffer = await convertOBJFileToMEF(selectedFile);
      
      clearInterval(progressInterval);
      setProgress(100);
      setConvertedData(mefBuffer);

      toast({
        title: "Conversion Successful",
        description: "OBJ file has been converted to MEF format!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedData || !selectedFile) return;

    const blob = new Blob([convertedData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name.replace('.obj', '.mef');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "MEF file download has begun.",
      variant: "default"
    });
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setConvertedData(null);
    setProgress(0);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          OBJ to MEF Converter
        </CardTitle>
        <CardDescription>
          Convert Wavefront OBJ files to IGI2 MEF format for use in Project IGI 2: Covert Strike
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select OBJ File</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => document.getElementById('obj-file-input')?.click()}
            >
              <Upload className="w-4 h-4" />
              Choose File
            </Button>
            <input
              id="obj-file-input"
              type="file"
              accept=".obj"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile && (
              <span className="text-sm text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
        </div>

        {/* Conversion Progress */}
        {isConverting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Converting...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Conversion Status */}
        {convertedData && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Conversion completed successfully! The MEF file is ready for download.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleConvert}
            disabled={!selectedFile || isConverting}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Convert to MEF
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!convertedData}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download MEF
          </Button>
          
          <Button
            variant="ghost"
            onClick={clearSelection}
            disabled={!selectedFile}
          >
            Clear
          </Button>
        </div>

        {/* Information */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> This converter supports basic OBJ files with vertices, faces, normals, and UV coordinates. 
            Complex OBJ features like materials or groups may not be fully supported.
          </AlertDescription>
        </Alert>

        {/* Format Information */}
        <div className="text-sm text-muted-foreground space-y-2">
          <h4 className="font-medium">Supported OBJ Features:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Vertices (v)</li>
            <li>Vertex normals (vn)</li>
            <li>Texture coordinates (vt)</li>
            <li>Faces (f) - Triangular and quad faces</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}