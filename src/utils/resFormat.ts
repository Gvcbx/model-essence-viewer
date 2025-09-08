/**
 * IGI2 RES Archive Format Implementation
 * Based on the ILFF/FORM container format specification
 */

interface RESFileEntry {
  name: string;
  data: ArrayBuffer;
  offset?: number;
}

interface RESArchive {
  files: RESFileEntry[];
  totalSize: number;
}

class RESArchiveBuilder {
  private files: RESFileEntry[] = [];
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();

  /**
   * Add a MEF file to the RES archive
   */
  addFile(filename: string, data: ArrayBuffer): void {
    this.files.push({
      name: filename.startsWith('LOCAL:') ? filename : `LOCAL:${filename}`,
      data: data
    });
  }

  /**
   * Build the complete RES archive according to IGI2 specification
   */
  build(): ArrayBuffer {
    const headerSize = 16; // ILFF header (4) + Archive Size (4) + Version (4) + null (4)
    const iresHeaderSize = 4; // IRES header
    
    let totalArchiveSize = headerSize + iresHeaderSize;
    const fileEntries: ArrayBuffer[] = [];

    // Calculate file entry sizes and prepare data
    for (const file of this.files) {
      const filenameBytes = this.textEncoder.encode(file.name + '\0');
      const paddedFilenameLength = Math.ceil(filenameBytes.length / 4) * 4;
      
      const entryHeaderSize = 16; // NAME + Filename Length + Version + Offset
      const bodyHeaderSize = 16; // BODY + File Length + Version + File Size
      const paddedDataLength = Math.ceil(file.data.byteLength / 4) * 4;
      
      const entrySize = entryHeaderSize + paddedFilenameLength + bodyHeaderSize + paddedDataLength;
      
      // Create entry buffer
      const entryBuffer = new ArrayBuffer(entrySize);
      const entryView = new DataView(entryBuffer);
      const entryBytes = new Uint8Array(entryBuffer);
      
      let offset = 0;
      
      // Entry Header
      entryView.setUint32(offset, 0x454D414E, true); // 'NAME'
      offset += 4;
      entryView.setUint32(offset, filenameBytes.length, true); // Filename Length (including null)
      offset += 4;
      entryView.setUint32(offset, 4, true); // Version
      offset += 4;
      entryView.setUint32(offset, entryHeaderSize + paddedFilenameLength, true); // Offset to BODY
      offset += 4;
      
      // Filename with null terminator and padding
      entryBytes.set(filenameBytes, offset);
      offset += paddedFilenameLength;
      
      // Body Header
      entryView.setUint32(offset, 0x59444F42, true); // 'BODY'
      offset += 4;
      entryView.setUint32(offset, file.data.byteLength, true); // File Length
      offset += 4;
      entryView.setUint32(offset, 4, true); // Version
      offset += 4;
      entryView.setUint32(offset, bodyHeaderSize + paddedDataLength, true); // File Size
      offset += 4;
      
      // File Data with padding
      entryBytes.set(new Uint8Array(file.data), offset);
      
      fileEntries.push(entryBuffer);
      totalArchiveSize += entrySize;
    }

    // Create final archive buffer
    const archiveBuffer = new ArrayBuffer(totalArchiveSize);
    const archiveView = new DataView(archiveBuffer);
    const archiveBytes = new Uint8Array(archiveBuffer);
    
    let offset = 0;
    
    // Archive Header
    archiveView.setUint32(offset, 0x46464C49, true); // 'ILFF'
    offset += 4;
    archiveView.setUint32(offset, totalArchiveSize, true); // Archive Size
    offset += 4;
    archiveView.setUint32(offset, 4, true); // Version
    offset += 4;
    archiveView.setUint32(offset, 0, true); // null
    offset += 4;
    
    // Resources Header
    archiveView.setUint32(offset, 0x53455249, true); // 'IRES'
    offset += 4;
    
    // Copy all file entries
    for (const entry of fileEntries) {
      archiveBytes.set(new Uint8Array(entry), offset);
      offset += entry.byteLength;
    }
    
    return archiveBuffer;
  }
}

class RESArchiveReader {
  private textDecoder = new TextDecoder();

  /**
   * Parse a RES archive and extract all files
   */
  parse(buffer: ArrayBuffer): RESArchive {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    let offset = 0;

    // Read Archive Header
    const headerSignature = view.getUint32(offset, true);
    if (headerSignature !== 0x46464C49) { // 'ILFF'
      throw new Error('Invalid RES archive: Missing ILFF header');
    }
    offset += 4;

    const archiveSize = view.getUint32(offset, true);
    offset += 4;
    
    const version = view.getUint32(offset, true);
    offset += 4;
    
    const nullField = view.getUint32(offset, true);
    offset += 4;

    // Read Resources Header
    const resourcesSignature = view.getUint32(offset, true);
    if (resourcesSignature !== 0x53455249) { // 'IRES'
      throw new Error('Invalid RES archive: Missing IRES header');
    }
    offset += 4;

    const files: RESFileEntry[] = [];

    // Read file entries
    while (offset < buffer.byteLength) {
      try {
        // Read Entry Header
        const entrySignature = view.getUint32(offset, true);
        if (entrySignature !== 0x454D414E) { // 'NAME'
          break; // End of entries
        }
        offset += 4;

        const filenameLength = view.getUint32(offset, true);
        offset += 4;
        
        const entryVersion = view.getUint32(offset, true);
        offset += 4;
        
        const bodyOffset = view.getUint32(offset, true);
        offset += 4;

        // Read filename
        const filenameBytes = bytes.slice(offset, offset + filenameLength);
        const filename = this.textDecoder.decode(filenameBytes).replace(/\0/g, '');
        
        // Move to body offset (from start of entry)
        const entryStart = offset - 16;
        offset = entryStart + bodyOffset;

        // Read Body Header
        const bodySignature = view.getUint32(offset, true);
        if (bodySignature !== 0x59444F42) { // 'BODY'
          throw new Error('Invalid file entry: Missing BODY header');
        }
        offset += 4;

        const fileLength = view.getUint32(offset, true);
        offset += 4;
        
        const bodyVersion = view.getUint32(offset, true);
        offset += 4;
        
        const totalFileSize = view.getUint32(offset, true);
        offset += 4;

        // Read file data
        const fileData = buffer.slice(offset, offset + fileLength);
        files.push({
          name: filename,
          data: fileData
        });

        // Move to next entry (with padding)
        offset = entryStart + 16 + Math.ceil((filenameLength) / 4) * 4 + totalFileSize;

      } catch (error) {
        console.warn('Error reading file entry:', error);
        break;
      }
    }

    return {
      files,
      totalSize: archiveSize
    };
  }
}

export { RESArchiveBuilder, RESArchiveReader, type RESArchive, type RESFileEntry };