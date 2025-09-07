// OBJ to MEF Converter for IGI2 Covert Strike
// Converts Wavefront OBJ files to MEF format

interface OBJData {
  vertices: number[][];
  faces: number[][];
  normals?: number[][];
  uvs?: number[][];
}

interface MEFChunkHeader {
  name: string;
  size: number;
  param: number;
  next: number;
}

export class OBJToMEFConverter {
  private objData: OBJData = {
    vertices: [],
    faces: [],
    normals: [],
    uvs: []
  };

  public parseOBJ(objContent: string): OBJData {
    const lines = objContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed === '') continue;
      
      const parts = trimmed.split(/\s+/);
      const command = parts[0];
      
      switch (command) {
        case 'v': // vertex
          if (parts.length >= 4) {
            this.objData.vertices.push([
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            ]);
          }
          break;
          
        case 'vn': // vertex normal
          if (parts.length >= 4) {
            this.objData.normals!.push([
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            ]);
          }
          break;
          
        case 'vt': // texture coordinate
          if (parts.length >= 3) {
            this.objData.uvs!.push([
              parseFloat(parts[1]),
              parseFloat(parts[2])
            ]);
          }
          break;
          
        case 'f': // face
          if (parts.length >= 4) {
            const face: number[] = [];
            for (let i = 1; i < parts.length; i++) {
              const vertexData = parts[i].split('/');
              // OBJ indices are 1-based, convert to 0-based
              const vertexIndex = parseInt(vertexData[0]) - 1;
              face.push(vertexIndex);
            }
            
            // Triangulate if quad (convert quad to two triangles)
            if (face.length === 4) {
              this.objData.faces.push([face[0], face[1], face[2]]);
              this.objData.faces.push([face[0], face[2], face[3]]);
            } else if (face.length === 3) {
              this.objData.faces.push(face);
            }
          }
          break;
      }
    }
    
    return this.objData;
  }

  private writeString(buffer: ArrayBuffer, offset: number, str: string): number {
    const view = new Uint8Array(buffer, offset);
    for (let i = 0; i < str.length; i++) {
      view[i] = str.charCodeAt(i);
    }
    return str.length;
  }

  private writeInt32(buffer: ArrayBuffer, offset: number, value: number): void {
    const view = new DataView(buffer);
    view.setInt32(offset, value, true); // little endian
  }

  private writeFloat32(buffer: ArrayBuffer, offset: number, value: number): void {
    const view = new DataView(buffer);
    view.setFloat32(offset, value, true); // little endian
  }

  private writeUint16(buffer: ArrayBuffer, offset: number, value: number): void {
    const view = new DataView(buffer);
    view.setUint16(offset, value, true); // little endian
  }

  private createChunkHeader(name: string, size: number, param: number = 0, next: number = 0): ArrayBuffer {
    const buffer = new ArrayBuffer(16);
    let offset = 0;
    
    offset += this.writeString(buffer, offset, name.padEnd(4, '\0').substring(0, 4));
    this.writeInt32(buffer, offset, size);
    offset += 4;
    this.writeInt32(buffer, offset, param);
    offset += 4;
    this.writeInt32(buffer, offset, next);
    
    return buffer;
  }

  private createXTRVChunk(): ArrayBuffer {
    const vertexCount = this.objData.vertices.length;
    const hasNormals = this.objData.normals && this.objData.normals.length > 0;
    const hasUVs = this.objData.uvs && this.objData.uvs.length > 0;
    
    // Determine stride based on available data
    let stride = 12; // position only (3 * 4 bytes)
    if (hasNormals) stride += 12; // normals (3 * 4 bytes)
    if (hasUVs) stride += 8; // UV coordinates (2 * 4 bytes)
    
    const chunkSize = vertexCount * stride;
    const totalSize = 16 + chunkSize; // header + data
    const buffer = new ArrayBuffer(totalSize);
    
    // Write chunk header
    const headerBuffer = this.createChunkHeader('XTRV', chunkSize);
    new Uint8Array(buffer, 0, 16).set(new Uint8Array(headerBuffer));
    
    // Write vertex data
    let offset = 16;
    for (let i = 0; i < vertexCount; i++) {
      const vertex = this.objData.vertices[i];
      
      // Write position
      this.writeFloat32(buffer, offset, vertex[0]);
      this.writeFloat32(buffer, offset + 4, vertex[1]);
      this.writeFloat32(buffer, offset + 8, vertex[2]);
      offset += 12;
      
      // Write normal if available
      if (hasNormals && this.objData.normals![i]) {
        const normal = this.objData.normals![i];
        this.writeFloat32(buffer, offset, normal[0]);
        this.writeFloat32(buffer, offset + 4, normal[1]);
        this.writeFloat32(buffer, offset + 8, normal[2]);
        offset += 12;
      }
      
      // Write UV if available
      if (hasUVs && this.objData.uvs![i]) {
        const uv = this.objData.uvs![i];
        this.writeFloat32(buffer, offset, uv[0]);
        this.writeFloat32(buffer, offset + 4, uv[1]);
        offset += 8;
      }
    }
    
    return buffer;
  }

  private createECAFChunk(): ArrayBuffer {
    const faceCount = this.objData.faces.length;
    const chunkSize = faceCount * 6; // 3 indices * 2 bytes each
    const totalSize = 16 + chunkSize; // header + data
    const buffer = new ArrayBuffer(totalSize);
    
    // Write chunk header
    const headerBuffer = this.createChunkHeader('ECAF', chunkSize);
    new Uint8Array(buffer, 0, 16).set(new Uint8Array(headerBuffer));
    
    // Write face data
    let offset = 16;
    for (const face of this.objData.faces) {
      this.writeUint16(buffer, offset, face[0]);
      this.writeUint16(buffer, offset + 2, face[1]);
      this.writeUint16(buffer, offset + 4, face[2]);
      offset += 6;
    }
    
    return buffer;
  }

  public convertToMEF(objContent: string): ArrayBuffer {
    // Parse OBJ file
    this.parseOBJ(objContent);
    
    if (this.objData.vertices.length === 0) {
      throw new Error('No vertices found in OBJ file');
    }
    
    if (this.objData.faces.length === 0) {
      throw new Error('No faces found in OBJ file');
    }
    
    // Create chunks
    const xtrvChunk = this.createXTRVChunk();
    const ecafChunk = this.createECAFChunk();
    
    // Calculate total file size
    const headerSize = 8; // ILFF header + file size
    const totalSize = headerSize + xtrvChunk.byteLength + ecafChunk.byteLength;
    
    // Create final MEF file
    const mefBuffer = new ArrayBuffer(totalSize);
    let offset = 0;
    
    // Write ILFF header
    offset += this.writeString(mefBuffer, offset, 'ILFF');
    this.writeInt32(mefBuffer, offset, totalSize);
    offset += 4;
    
    // Write XTRV chunk
    new Uint8Array(mefBuffer, offset, xtrvChunk.byteLength).set(new Uint8Array(xtrvChunk));
    offset += xtrvChunk.byteLength;
    
    // Write ECAF chunk
    new Uint8Array(mefBuffer, offset, ecafChunk.byteLength).set(new Uint8Array(ecafChunk));
    
    return mefBuffer;
  }
}

export async function convertOBJFileToMEF(objFile: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const objContent = e.target?.result as string;
        const converter = new OBJToMEFConverter();
        const mefBuffer = converter.convertToMEF(objContent);
        resolve(mefBuffer);
      } catch (error) {
        reject(new Error(`Failed to convert OBJ to MEF: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read OBJ file'));
    reader.readAsText(objFile);
  });
}