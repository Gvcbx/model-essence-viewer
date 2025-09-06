// src/lib/mef-loader.js
// MEF/ILFF parser for browser (ES module)

function readAscii(bytes, off, len) {
  let s = '';
  for (let i = 0; i < len && off + i < bytes.length; i++) {
    const c = bytes[off + i];
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s;
}

function isPrintable(bytes, off, len = 4) {
  for (let i = 0; i < len && off + i < bytes.length; i++) {
    const c = bytes[off + i];
    if (c < 32 || c > 126) return false;
  }
  return true;
}

function findAsciiTag(bytes, tagStr) {
  const tag = new TextEncoder().encode(tagStr);
  for (let i = 0; i <= bytes.length - tag.length; i++) {
    let ok = true;
    for (let j = 0; j < tag.length; j++) {
      if (bytes[i + j] !== tag[j]) { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

function parseILFF(buffer) {
  const bytes = new Uint8Array(buffer);
  const dv = new DataView(buffer);
  if (bytes.length < 4) throw new Error('Buffer too small');
  const magic = readAscii(bytes, 0, 4);
  if (magic !== 'ILFF') throw new Error('Not an ILFF container');

  const chunks = {};
  // try TOC
  try {
    const cnt = dv.getUint32(4, true);
    const maybeTOCsize = 4 + 4 + cnt * 16;
    if (cnt > 0 && cnt < 65536 && maybeTOCsize <= bytes.length) {
      let ok = true;
      const tmp = [];
      let base = 8;
      for (let i = 0; i < cnt; i++) {
        const id = readAscii(bytes, base, 4);
        const off = dv.getUint32(base + 4, true);
        const size = dv.getUint32(base + 8, true);
        const align = dv.getUint32(base + 12, true);
        if (off + size > bytes.length) { ok = false; break; }
        tmp.push({ id, off, size, align });
        base += 16;
      }
      if (ok && tmp.length) {
        for (const e of tmp) {
          chunks[e.id] = chunks[e.id] || [];
          chunks[e.id].push({ off: e.off, size: e.size });
        }
        return { chunks, bytes, dv };
      }
    }
  } catch (e) { /* ignore */ }

  // linear ASCII-chunks fallback
  let ofs = 4;
  while (ofs + 8 <= bytes.length) {
    if (!isPrintable(bytes, ofs, 4)) { ofs += 4; continue; }
    const id = readAscii(bytes, ofs, 4);
    const size = dv.getUint32(ofs + 4, true);
    const off = ofs + 8;
    if (off + size > bytes.length) break;
    chunks[id] = chunks[id] || [];
    chunks[id].push({ off, size });
    ofs = off + size;
    ofs = (ofs + 3) & ~3;
  }

  // try locate common tags if not present
  const mustTags = ['ECAF','XTRV','XTRVX','HSEM','MANB','DNER'];
  for (const t of mustTags) {
    if (!(t in chunks)) {
      const pos = findAsciiTag(bytes, t);
      if (pos >= 0) {
        try {
          const size = dv.getUint32(pos + 4, true);
          const off = pos + 8;
          if (off + size <= bytes.length) {
            chunks[t] = chunks[t] || [];
            chunks[t].push({ off, size });
          }
        } catch(e){}
      }
    }
  }

  return { chunks, bytes, dv };
}

function parseECAF(ecafView) {
  const dv = new DataView(ecafView.buffer, ecafView.byteOffset, ecafView.byteLength);
  const triCount = Math.floor(ecafView.byteLength / 6);
  const indices = new Uint32Array(triCount * 3);
  let idx = 0;
  for (let i = 0; i < triCount; i++) {
    const a = dv.getUint16(i * 6 + 0, true);
    const b = dv.getUint16(i * 6 + 2, true);
    const c = dv.getUint16(i * 6 + 4, true);
    indices[idx++] = a; indices[idx++] = b; indices[idx++] = c;
  }
  return indices;
}

function chooseStrideAndPayload(xtrvBytes, indices) {
  const payloads = [xtrvBytes];
  if (xtrvBytes.length >= 16) payloads.push(xtrvBytes.slice(16));
  const maxIndex = (indices && indices.length) ? Math.max.apply(null, Array.from(indices)) : 0;
  const vcount_est = maxIndex + 1;
  const candidates = [12,20,24,28,32,36,40,44];

  for (const pay of payloads) {
    for (const s of candidates) {
      if (pay.length % s !== 0) continue;
      const vcount = pay.length / s;
      if (vcount === vcount_est || (vcount_est && Math.abs(vcount - vcount_est) <= 4)) {
        return { stride: s, payload: pay };
      }
    }
  }
  return { stride: 12, payload: payloads[0] };
}

function decodeXTRV(xtrvBytes, indices) {
  const { stride, payload } = chooseStrideAndPayload(xtrvBytes, indices);
  const vcount = Math.floor(payload.length / stride);
  const dv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);

  const positions = new Float32Array(vcount * 3);
  let normals = null;
  let uv0 = null;
  let uv1 = null;

  const rem = stride - 12;
  if (rem >= 12) normals = new Float32Array(vcount * 3);
  if (rem >= 8) {
    if (rem >= 16) {
      uv1 = new Float32Array(vcount * 2);
      uv0 = new Float32Array(vcount * 2);
    } else {
      uv0 = new Float32Array(vcount * 2);
    }
  }

  for (let i = 0; i < vcount; i++) {
    const base = i * stride;
    positions[i*3+0] = dv.getFloat32(base + 0, true);
    positions[i*3+1] = dv.getFloat32(base + 4, true);
    positions[i*3+2] = dv.getFloat32(base + 8, true);
    let off = 12;
    if (normals) {
      normals[i*3+0] = dv.getFloat32(base + off + 0, true);
      normals[i*3+1] = dv.getFloat32(base + off + 4, true);
      normals[i*3+2] = dv.getFloat32(base + off + 8, true);
      off += 12;
    }
    if (uv1 && uv0) {
      uv1[i*2+0] = dv.getFloat32(base + off + 0, true);
      uv1[i*2+1] = dv.getFloat32(base + off + 4, true);
      off += 8;
    }
    if (uv0) {
      uv0[i*2+0] = dv.getFloat32(base + off + 0, true);
      uv0[i*2+1] = dv.getFloat32(base + off + 4, true);
      off += 8;
    }
  }

  return { positions, normals, uv0, uv1, stride, vcount };
}

export function parseMEF(arrayBuffer) {
  const { chunks } = parseILFF(arrayBuffer);
  const ecafEntry = (chunks['ECAF'] && chunks['ECAF'][0]) ? chunks['ECAF'][0] : null;
  const xtrvxEntry = (chunks['XTRVX'] && chunks['XTRVX'][0]) ? chunks['XTRVX'][0] : (chunks['XTRV'] && chunks['XTRV'][0] ? chunks['XTRV'][0] : null);

  if (!ecafEntry) throw new Error('ECAF (faces) not found');
  if (!xtrvxEntry) throw new Error('XTRV/XTRVX (verts) not found');

  const ecafBytes = new Uint8Array(arrayBuffer, ecafEntry.off, ecafEntry.size);
  const xtrvBytes = new Uint8Array(arrayBuffer, xtrvxEntry.off, xtrvxEntry.size);

  const indices = parseECAF(ecafBytes);
  const xinfo = decodeXTRV(xtrvBytes, indices);

  let idxArr = indices;
  const maxIndex = idxArr.length ? Math.max.apply(null, Array.from(idxArr)) : 0;
  if (maxIndex <= 0xFFFF) {
    const a16 = new Uint16Array(idxArr.length);
    for (let i = 0; i < idxArr.length; i++) a16[i] = idxArr[i];
    idxArr = a16;
  }

  let bones = null;
  if (chunks['MANB'] && chunks['MANB'][0]) {
    const me = chunks['MANB'][0];
    const manbBytes = new Uint8Array(arrayBuffer, me.off, me.size);
    bones = [];
    for (let i = 0; i < manbBytes.length; i += 16) {
      let name = readAscii(manbBytes, i, 16);
      name = name.trim();
      if (name.length > 0) bones.push(name);
    }
  }

  return {
    positions: xinfo.positions,
    normals: xinfo.normals,
    uv0: xinfo.uv0,
    uv1: xinfo.uv1,
    indices: idxArr,
    stride: xinfo.stride,
    vcount: xinfo.vcount,
    sections: Object.keys(chunks),
    bones,
  };
}

export function buildThreeMesh(parsed, materialOptions = {}) {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(parsed.positions, 3));
  if (parsed.normals) geom.setAttribute('normal', new THREE.BufferAttribute(parsed.normals, 3));
  if (parsed.uv0) geom.setAttribute('uv', new THREE.BufferAttribute(parsed.uv0, 2));
  if (parsed.uv1) geom.setAttribute('uv2', new THREE.BufferAttribute(parsed.uv1, 2));
  geom.setIndex(new THREE.BufferAttribute(parsed.indices, 1));
  if (!parsed.normals) geom.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial(Object.assign({ color: 0xcccccc, metalness: 0.1, roughness: 0.6 }, materialOptions));
  const mesh = new THREE.Mesh(geom, mat);
  return mesh;
}
