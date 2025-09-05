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
  private debugInfo: string[] = [];

  constructor(data: ArrayBuffer) {
    this.data = data;
    this.view = new DataView(data);
    this.offset = 0;
  }

  private log(message: string): void {
    this.debugInfo.push(message);
    console.log(`MEF Parser: ${message}`);
  }

  private readBytes(count: number): Uint8Array {
    if (this.offset + count > this.data.byteLength) {
      throw new Error(`Read beyond buffer: offset ${this.offset}, count ${count}, size ${this.data.byteLength}`);
    }
    const bytes = new Uint8Array(this.data, this.offset, count);
    this.offset += count;
    return bytes;
  }

  private readInt(): number {
    if (this.offset + 4 > this.data.byteLength) {
      throw new Error(`Read beyond buffer: offset ${this.offset}, size ${this.data.byteLength}`);
    }
    const value = this.view.getInt32(this.offset, true); // little endian
    this.offset += 4;
    return value;
  }

  private readUint16(): number {
    if (this.offset + 2 > this.data.byteLength) {
      throw new Error(`Read beyond buffer: offset ${this.offset}, size ${this.data.byteLength}`);
    }
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
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
    
    if (this.offset < 0 || this.offset > this.data.byteLength) {
      throw new Error(`Invalid seek position: ${this.offset}, buffer size: ${this.data.byteLength}`);
    }
  }

  private getOffset(): number {
    return this.offset;
  }

  private detectVertexStride(chunkSize: number): { stride: number, vertexCount: number } | null {
    const strides = [12, 16, 20, 24, 32];
    const validStrides: Array<{ stride: number, vertexCount: number }> = [];

    for (const stride of strides) {
      if (stride > 0 && (chunkSize % stride) === 0) {
        const vertexCount = chunkSize / stride;
        if (vertexCount > 0 && vertexCount < 2000000) {
          validStrides.push({ stride, vertexCount });
        }
      }
    }

    this.log(`XTVC chunk size=${chunkSize}, possible strides: ${validStrides.map(s => `${s.stride}(${s.vertexCount}v)`).join(', ')}`);

    if (validStrides.length === 0) {
      return null;
    }

    // Prefer stride 16 if available, otherwise use the first valid one
    const preferred = validStrides.find(s => s.stride === 16);
    const chosen = preferred || validStrides[0];
    
    this.log(`Using stride ${chosen.stride}, vertices=${chosen.vertexCount}`);
    return chosen;
  }

  public parse(): MEFModel {
    this.debugInfo = [];
    
    // Check file size
    if (this.data.byteLength < 8) {
      throw new Error('File too small to be a valid MEF file');
    }

    // Check MEF header
    const header = this.readString(4);
    if (header !== 'ILFF') {
      throw new Error('Invalid MEF file: Missing ILFF header');
    }

    const fileSize = this.readInt();
    this.log(`File size: ${fileSize}, actual size: ${this.data.byteLength}`);
    
    // Skip OCEM block pointer (12 bytes)
    try {
      this.seek(12, true);
    } catch (error) {
      this.log('Warning: Could not skip OCEM block');
    }

    // Read chunks
    const chunks: MEFChunk[] = [];
    while (this.getOffset() < fileSize && this.getOffset() < this.data.byteLength) {
      const chunkOffset = this.getOffset();
      
      // Check if we have enough data for chunk header
      if (chunkOffset + 16 > this.data.byteLength) {
        this.log(`Chunk header would exceed buffer at offset ${chunkOffset}`);
        break;
      }

      const name = this.readString(4);
      const size = this.readInt();
      const param = this.readInt();
      const next = this.readInt();

      const chunk = {
        name,
        offset: chunkOffset,
        size,
        next
      };
      
      chunks.push(chunk);
      this.log(`Chunk: ${name} at ${chunkOffset}, size=${size}, next=${next}`);

      // Validate chunk payload
      const payloadOffset = chunkOffset + 16;
      if (payloadOffset + size > this.data.byteLength) {
        this.log(`Warning: Chunk ${name} payload exceeds buffer`);
      }

      if (next === 0) {
        break;
      } else {
        try {
          this.seek(next - 16, true);
        } catch (error) {
          this.log(`Warning: Could not seek to next chunk at ${next}`);
          break;
        }
      }
    }

    // Parse meshes from chunks
    const meshes: MEFMesh[] = [];
    let totalVertices = 0;
    let totalTriangles = 0;
    let currentVertices: Float32Array | null = null;
    let currentVertexCount = 0;
    let meshCounter = 0;

    for (const chunk of chunks) {
      const payloadOffset = chunk.offset + 16;
      
      // Skip chunks with invalid payload
      if (payloadOffset + chunk.size > this.data.byteLength) {
        this.log(`Skipping chunk ${chunk.name} - payload out of range`);
        continue;
      }

      this.seek(payloadOffset);

      if (chunk.name === 'XTVC' && chunk.size > 0) {
        // Auto-detect vertex stride
        const strideInfo = this.detectVertexStride(chunk.size);
        if (!strideInfo) {
          this.log(`Could not determine valid stride for XTVC chunk`);
          continue;
        }

        const { stride, vertexCount } = strideInfo;
        currentVertexCount = vertexCount;
        
        try {
          const vertexData = this.readBytes(chunk.size);
          currentVertices = new Float32Array(vertexCount * 3); // Only position data

          // Extract position data (first 3 floats from each vertex)
          const vertexView = new DataView(vertexData.buffer);
          for (let i = 0; i < vertexCount; i++) {
            const baseOffset = i * stride;
            currentVertices[i * 3] = vertexView.getFloat32(baseOffset, true);
            currentVertices[i * 3 + 1] = vertexView.getFloat32(baseOffset + 4, true);
            currentVertices[i * 3 + 2] = vertexView.getFloat32(baseOffset + 8, true);
          }
          
          this.log(`Extracted ${vertexCount} vertices using stride ${stride}`);
        } catch (error) {
          this.log(`Error reading XTVC chunk: ${error}`);
          currentVertices = null;
          currentVertexCount = 0;
        }

      } else if (chunk.name === 'ECFC' && chunk.size > 0 && currentVertices) {
        // Face data chunk
        const faceCount = chunk.size / 8; // 8 bytes per face (6 bytes indices + 2 padding)
        this.log(`ECFC chunk: size=${chunk.size}, triangles=${faceCount}`);
        
        const indices: number[] = [];
        
        try {
          for (let i = 0; i < faceCount; i++) {
            const a = this.readUint16();
            const b = this.readUint16();
            const c = this.readUint16();
            
            // Validate indices against vertex count
            if (a < currentVertexCount && b < currentVertexCount && c < currentVertexCount) {
              indices.push(a, b, c);
            } else {
              this.log(`Warning: Invalid triangle ${i}: indices [${a}, ${b}, ${c}] exceed vertex count ${currentVertexCount}`);
            }
            
            // Skip 2 bytes padding
            this.seek(2, true);
          }
          
          this.log(`Collected ${indices.length / 3} valid triangles out of ${faceCount}`);
          
          if (indices.length > 0) {
            // Create mesh
            const mesh: MEFMesh = {
              name: `mesh_${meshCounter++}`,
              vertices: currentVertices,
              indices: new Uint16Array(indices),
              vertexCount: currentVertexCount,
              triangleCount: indices.length / 3
            };

            meshes.push(mesh);
            totalVertices += mesh.vertexCount;
            totalTriangles += mesh.triangleCount;
          }
        } catch (error) {
          this.log(`Error reading ECFC chunk: ${error}`);
        }
        
        currentVertices = null;
        currentVertexCount = 0;
      }
    }

    if (meshes.length === 0) {
      throw new Error(`No valid meshes found in MEF file. Debug info:\n${this.debugInfo.join('\n')}`);
    }

    this.log(`Final result: ${meshes.length} meshes, ${totalVertices} vertices, ${totalTriangles} triangles`);

    return {
      meshes,
      totalVertices,
      totalTriangles,
      fileSize,
      chunks
    };
  }

  public getDebugInfo(): string[] {
    return this.debugInfo;
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