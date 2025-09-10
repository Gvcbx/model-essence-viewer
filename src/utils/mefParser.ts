// MEF File Parser for IGI2 Covert Strike
// Updated based on detailed MEF format specification

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
  type: 'render' | 'collision' | 'shadow';
}

interface MEFModelInfo {
  modelType?: number;
  date?: string;
  vertexCount?: number;
  faceCount?: number;
}

interface MEFModel {
  meshes: MEFMesh[];
  totalVertices: number;
  totalTriangles: number;
  fileSize: number;
  chunks: MEFChunk[];
  modelInfo?: MEFModelInfo;
}

// Helper function to parse MEF file from File object
export const parseMEFFile = async (file: File): Promise<MEFModel> => {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new MEFParser(arrayBuffer);
  return parser.parse();
};

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

  private detectVertexFormat(chunkSize: number, chunkName: string): { stride: number, vertexCount: number, format: string } | null {
    // Based on MEF specification:
    // Rigid (type0): pos(12) + normal(12) + uv(8) = 32 bytes
    // Lightmap (type3): pos(12) + lightmapUV(8) = 20 bytes  
    // Bone (type1): pos(12) + normal(12) + uv(8) + weights/bones = 32+ bytes
    // Simple position only: 12 bytes
    // Position + UV: 20 bytes
    // Position + Normal: 24 bytes
    
    const formats = [
      { stride: 32, format: 'rigid_full', desc: 'Rigid: pos+normal+uv' },
      { stride: 24, format: 'pos_normal', desc: 'Position + Normal' },
      { stride: 20, format: 'lightmap', desc: 'Lightmap: pos+uv' },
      { stride: 16, format: 'pos_uv_basic', desc: 'Position + UV (basic)' },
      { stride: 12, format: 'position_only', desc: 'Position only' }
    ];
    
    const validFormats: Array<{ stride: number, vertexCount: number, format: string, desc: string }> = [];

    for (const fmt of formats) {
      if (fmt.stride > 0 && (chunkSize % fmt.stride) === 0) {
        const vertexCount = chunkSize / fmt.stride;
        if (vertexCount > 0 && vertexCount < 2000000) {
          validFormats.push({ ...fmt, vertexCount });
        }
      }
    }

    this.log(`${chunkName} chunk size=${chunkSize}, possible formats: ${validFormats.map(f => `${f.format}(${f.vertexCount}v)`).join(', ')}`);

    if (validFormats.length === 0) {
      return null;
    }

    // Prefer more complete vertex formats
    const chosen = validFormats[0]; // First match (highest stride)
    
    this.log(`Using ${chosen.format}: ${chosen.desc}, vertices=${chosen.vertexCount}`);
    return { stride: chosen.stride, vertexCount: chosen.vertexCount, format: chosen.format };
  }

  private parseHSEMChunk(chunk: MEFChunk): MEFModelInfo | null {
    if (chunk.size < 16) return null;
    
    try {
      const payloadOffset = chunk.offset + 16;
      this.seek(payloadOffset);
      
      // Read basic model info (structure may vary)
      const modelType = this.readInt();
      this.log(`Model type: ${modelType}`);
      
      return { modelType };
    } catch (error) {
      this.log(`Error parsing HSEM chunk: ${error}`);
      return null;
    }
  }

  private parseD3DRChunk(chunk: MEFChunk): { vertexCount?: number, faceCount?: number } | null {
    if (chunk.size < 8) return null;
    
    try {
      const payloadOffset = chunk.offset + 16;
      this.seek(payloadOffset);
      
      const faceCount = this.readInt();
      const vertexCount = this.readInt();
      
      this.log(`D3DR - Faces: ${faceCount}, Vertices: ${vertexCount}`);
      
      return { vertexCount, faceCount };
    } catch (error) {
      this.log(`Error parsing D3DR chunk: ${error}`);
      return null;
    }
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

    // Parse model info and meshes from chunks
    const meshes: MEFMesh[] = [];
    let totalVertices = 0;
    let totalTriangles = 0;
    let modelInfo: MEFModelInfo = {};
    
    // Storage for current mesh being built
    let currentRenderVertices: Float32Array | null = null;
    let currentRenderVertexCount = 0;
    let currentCollisionVertices: Float32Array | null = null;
    let currentCollisionVertexCount = 0;
    let currentShadowVertices: Float32Array | null = null;
    let currentShadowVertexCount = 0;
    let meshCounter = 0;

    // First pass: Parse model info chunks
    for (const chunk of chunks) {
      if (chunk.name === 'HSEM') {
        const info = this.parseHSEMChunk(chunk);
        if (info) {
          modelInfo = { ...modelInfo, ...info };
        }
      } else if (chunk.name === 'D3DR') {
        const info = this.parseD3DRChunk(chunk);
        if (info) {
          modelInfo = { ...modelInfo, ...info };
        }
      }
    }

    // Second pass: Parse mesh data
    for (const chunk of chunks) {
      const payloadOffset = chunk.offset + 16;
      
      // Skip chunks with invalid payload
      if (payloadOffset + chunk.size > this.data.byteLength) {
        this.log(`Skipping chunk ${chunk.name} - payload out of range`);
        continue;
      }

      this.seek(payloadOffset);

      // Render mesh vertices (XTRV)
      if (chunk.name === 'XTRV' && chunk.size > 0) {
        const formatInfo = this.detectVertexFormat(chunk.size, 'XTRV');
        if (!formatInfo) {
          this.log(`Could not determine valid format for XTRV chunk`);
          continue;
        }

        const { stride, vertexCount, format } = formatInfo;
        currentRenderVertexCount = vertexCount;
        
        try {
          const vertexData = this.readBytes(chunk.size);
          currentRenderVertices = new Float32Array(vertexCount * 3);

          const vertexView = new DataView(vertexData.buffer);
          for (let i = 0; i < vertexCount; i++) {
            const baseOffset = i * stride;
            currentRenderVertices[i * 3] = vertexView.getFloat32(baseOffset, true);
            currentRenderVertices[i * 3 + 1] = vertexView.getFloat32(baseOffset + 4, true);
            currentRenderVertices[i * 3 + 2] = vertexView.getFloat32(baseOffset + 8, true);
          }
          
          this.log(`Extracted ${vertexCount} render vertices using ${format}`);
        } catch (error) {
          this.log(`Error reading XTRV chunk: ${error}`);
          currentRenderVertices = null;
          currentRenderVertexCount = 0;
        }

      // Collision mesh vertices (XTVC)
      } else if (chunk.name === 'XTVC' && chunk.size > 0) {
        const formatInfo = this.detectVertexFormat(chunk.size, 'XTVC');
        if (!formatInfo) {
          this.log(`Could not determine valid format for XTVC chunk`);
          continue;
        }

        const { stride, vertexCount } = formatInfo;
        currentCollisionVertexCount = vertexCount;
        
        try {
          const vertexData = this.readBytes(chunk.size);
          currentCollisionVertices = new Float32Array(vertexCount * 3);

          const vertexView = new DataView(vertexData.buffer);
          for (let i = 0; i < vertexCount; i++) {
            const baseOffset = i * stride;
            currentCollisionVertices[i * 3] = vertexView.getFloat32(baseOffset, true);
            currentCollisionVertices[i * 3 + 1] = vertexView.getFloat32(baseOffset + 4, true);
            currentCollisionVertices[i * 3 + 2] = vertexView.getFloat32(baseOffset + 8, true);
          }
          
          this.log(`Extracted ${vertexCount} collision vertices`);
        } catch (error) {
          this.log(`Error reading XTVC chunk: ${error}`);
          currentCollisionVertices = null;
          currentCollisionVertexCount = 0;
        }

      // Shadow mesh vertices (XTVS)
      } else if (chunk.name === 'XTVS' && chunk.size > 0) {
        const formatInfo = this.detectVertexFormat(chunk.size, 'XTVS');
        if (!formatInfo) continue;

        const { stride, vertexCount } = formatInfo;
        currentShadowVertexCount = vertexCount;
        
        try {
          const vertexData = this.readBytes(chunk.size);
          currentShadowVertices = new Float32Array(vertexCount * 3);

          const vertexView = new DataView(vertexData.buffer);
          for (let i = 0; i < vertexCount; i++) {
            const baseOffset = i * stride;
            currentShadowVertices[i * 3] = vertexView.getFloat32(baseOffset, true);
            currentShadowVertices[i * 3 + 1] = vertexView.getFloat32(baseOffset + 4, true);
            currentShadowVertices[i * 3 + 2] = vertexView.getFloat32(baseOffset + 8, true);
          }
          
          this.log(`Extracted ${vertexCount} shadow vertices`);
        } catch (error) {
          this.log(`Error reading XTVS chunk: ${error}`);
          currentShadowVertices = null;
          currentShadowVertexCount = 0;
        }

      // Render mesh faces (ECAF)
      } else if (chunk.name === 'ECAF' && chunk.size > 0 && currentRenderVertices) {
        const faceCount = chunk.size / 6; // 3 indices * 2 bytes each = 6 bytes per face
        this.log(`ECAF chunk: size=${chunk.size}, triangles=${faceCount}`);
        
        const indices: number[] = [];
        
        try {
          for (let i = 0; i < faceCount; i++) {
            const a = this.readUint16();
            const b = this.readUint16();
            const c = this.readUint16();
            
            if (a < currentRenderVertexCount && b < currentRenderVertexCount && c < currentRenderVertexCount) {
              indices.push(a, b, c);
            } else {
              this.log(`Warning: Invalid render triangle ${i}: indices [${a}, ${b}, ${c}] exceed vertex count ${currentRenderVertexCount}`);
            }
          }
          
          if (indices.length > 0) {
            const mesh: MEFMesh = {
              name: `render_mesh_${meshCounter++}`,
              vertices: currentRenderVertices,
              indices: new Uint16Array(indices),
              vertexCount: currentRenderVertexCount,
              triangleCount: indices.length / 3,
              type: 'render'
            };

            meshes.push(mesh);
            totalVertices += mesh.vertexCount;
            totalTriangles += mesh.triangleCount;
            this.log(`Created render mesh: ${mesh.triangleCount} triangles`);
          }
        } catch (error) {
          this.log(`Error reading ECAF chunk: ${error}`);
        }
        
        currentRenderVertices = null;
        currentRenderVertexCount = 0;

      // Collision mesh faces (ECFC)
      } else if (chunk.name === 'ECFC' && chunk.size > 0 && currentCollisionVertices) {
        const faceCount = chunk.size / 8; // 6 bytes indices + 2 bytes padding
        this.log(`ECFC chunk: size=${chunk.size}, triangles=${faceCount}`);
        
        const indices: number[] = [];
        
        try {
          for (let i = 0; i < faceCount; i++) {
            const a = this.readUint16();
            const b = this.readUint16();
            const c = this.readUint16();
            
            if (a < currentCollisionVertexCount && b < currentCollisionVertexCount && c < currentCollisionVertexCount) {
              indices.push(a, b, c);
            } else {
              this.log(`Warning: Invalid collision triangle ${i}: indices [${a}, ${b}, ${c}] exceed vertex count ${currentCollisionVertexCount}`);
            }
            
            this.seek(2, true); // Skip padding
          }
          
          if (indices.length > 0) {
            const mesh: MEFMesh = {
              name: `collision_mesh_${meshCounter++}`,
              vertices: currentCollisionVertices,
              indices: new Uint16Array(indices),
              vertexCount: currentCollisionVertexCount,
              triangleCount: indices.length / 3,
              type: 'collision'
            };

            meshes.push(mesh);
            totalVertices += mesh.vertexCount;
            totalTriangles += mesh.triangleCount;
            this.log(`Created collision mesh: ${mesh.triangleCount} triangles`);
          }
        } catch (error) {
          this.log(`Error reading ECFC chunk: ${error}`);
        }
        
        currentCollisionVertices = null;
        currentCollisionVertexCount = 0;

      // Shadow mesh faces (CAFS)
      } else if (chunk.name === 'CAFS' && chunk.size > 0 && currentShadowVertices) {
        const faceCount = chunk.size / 6; // 3 indices * 2 bytes each
        this.log(`CAFS chunk: size=${chunk.size}, triangles=${faceCount}`);
        
        const indices: number[] = [];
        
        try {
          for (let i = 0; i < faceCount; i++) {
            const a = this.readUint16();
            const b = this.readUint16();
            const c = this.readUint16();
            
            if (a < currentShadowVertexCount && b < currentShadowVertexCount && c < currentShadowVertexCount) {
              indices.push(a, b, c);
            }
          }
          
          if (indices.length > 0) {
            const mesh: MEFMesh = {
              name: `shadow_mesh_${meshCounter++}`,
              vertices: currentShadowVertices,
              indices: new Uint16Array(indices),
              vertexCount: currentShadowVertexCount,
              triangleCount: indices.length / 3,
              type: 'shadow'
            };

            meshes.push(mesh);
            totalVertices += mesh.vertexCount;
            totalTriangles += mesh.triangleCount;
            this.log(`Created shadow mesh: ${mesh.triangleCount} triangles`);
          }
        } catch (error) {
          this.log(`Error reading CAFS chunk: ${error}`);
        }
        
        currentShadowVertices = null;
        currentShadowVertexCount = 0;
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
      chunks,
      modelInfo
    };
  }

  public getDebugInfo(): string[] {
    return this.debugInfo;
  }
}