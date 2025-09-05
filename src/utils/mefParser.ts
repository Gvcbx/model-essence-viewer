// MEF File Parser for IGI2 Covert Strike
// Based on Durik256's implementation for xentax.com

interface MEFChunk {
  name: string;
  offset: number;
  size: number;
  next: number;
}

interface MEFMesh {
  name: string;
  vertices: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
  triangleCount: number;
}

interface MEFModel {
  meshes: MEFMesh[];
  totalVertices: number;
  totalTriangles: number;
  fileSize: number;
  chunks: MEFChunk[];
}

export class MEFParser {
  private data: ArrayBuffer;
  private view: DataView;
  private offset: number = 0;

  constructor(data: ArrayBuffer) {
    this.data = data;
    this.view = new DataView(data);
    this.offset = 0;
  }

  private readBytes(count: number): Uint8Array {
    const bytes = new Uint8Array(this.data, this.offset, count);
    this.offset += count;
    return bytes;
  }

  private readInt(): number {
    const value = this.view.getInt32(this.offset, true); // little endian
    this.offset += 4;
    return value;
  }

  private readString(length: number): string {
    const bytes = this.readBytes(length);
    return String.fromCharCode(...bytes);
  }

  private seek(position: number, relative = false): void {
    if (relative) {
      this.offset += position;
    } else {
      this.offset = position;
    }
  }

  private getOffset(): number {
    return this.offset;
  }

  public parse(): MEFModel {
    // Check MEF header
    const header = this.readString(4);
    if (header !== 'ILFF') {
      throw new Error('Invalid MEF file: Missing ILFF header');
    }

    const fileSize = this.readInt();
    this.seek(12, true); // Skip OCEM

    // Read chunks
    const chunks: MEFChunk[] = [];
    while (this.getOffset() < fileSize) {
      const chunkOffset = this.getOffset();
      const name = this.readString(4);
      const size = this.readInt();
      const param = this.readInt();
      const next = this.readInt();

      chunks.push({
        name,
        offset: chunkOffset,
        size,
        next
      });

      if (next === 0) {
        break;
      } else {
        this.seek(next - 16, true);
      }
    }

    // Parse meshes from chunks
    const meshes: MEFMesh[] = [];
    let totalVertices = 0;
    let totalTriangles = 0;
    let currentVertices: Float32Array | null = null;
    let meshCounter = 0;

    for (const chunk of chunks) {
      this.seek(chunk.offset + 16);

      if (chunk.name === 'XTVC' && chunk.size > 0) {
        // Vertex data chunk
        const vertexData = this.readBytes(chunk.size);
        const vertexCount = chunk.size / 16; // 16 bytes per vertex (4 floats)
        currentVertices = new Float32Array(vertexCount * 3); // Only position data

        // Extract position data (skip the 4th component)
        const vertexView = new DataView(vertexData.buffer);
        for (let i = 0; i < vertexCount; i++) {
          const baseOffset = i * 16;
          currentVertices[i * 3] = vertexView.getFloat32(baseOffset, true);
          currentVertices[i * 3 + 1] = vertexView.getFloat32(baseOffset + 4, true);
          currentVertices[i * 3 + 2] = vertexView.getFloat32(baseOffset + 8, true);
        }
      } else if (chunk.name === 'ECFC' && chunk.size > 0 && currentVertices) {
        // Face data chunk
        const faceCount = chunk.size / 8; // 8 bytes per face (6 bytes indices + 2 padding)
        const indices = new Uint16Array(faceCount * 3);
        
        for (let i = 0; i < faceCount; i++) {
          const faceOffset = chunk.offset + 16 + (i * 8);
          this.seek(faceOffset);
          
          indices[i * 3] = this.view.getUint16(this.offset, true);
          indices[i * 3 + 1] = this.view.getUint16(this.offset + 2, true);
          indices[i * 3 + 2] = this.view.getUint16(this.offset + 4, true);
          // Skip 2 bytes padding
        }

        // Create mesh
        const mesh: MEFMesh = {
          name: `mesh_${meshCounter++}`,
          vertices: currentVertices,
          indices,
          vertexCount: currentVertices.length / 3,
          triangleCount: faceCount
        };

        meshes.push(mesh);
        totalVertices += mesh.vertexCount;
        totalTriangles += mesh.triangleCount;
        currentVertices = null;
      }
    }

    if (meshes.length === 0) {
      throw new Error('No valid meshes found in MEF file');
    }

    return {
      meshes,
      totalVertices,
      totalTriangles,
      fileSize,
      chunks
    };
  }
}

export async function parseMEFFile(file: File): Promise<MEFModel> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const parser = new MEFParser(buffer);
        const model = parser.parse();
        resolve(model);
      } catch (error) {
        reject(new Error(`Failed to parse MEF file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}