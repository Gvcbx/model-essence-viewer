// src/components/MefViewer.tsx
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { parseMEF, buildThreeMesh } from "../lib/mef-loader.js";

const MefViewer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(2, 4, 3);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    const controls = new OrbitControls(camera, renderer.domElement);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = mountRef.current?.clientWidth || 800;
      const h = mountRef.current?.clientHeight || 600;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sceneRef.current) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const parsed = parseMEF(arrayBuffer);
      const mesh = buildThreeMesh(parsed);

      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }
      modelRef.current = mesh;
      sceneRef.current.add(mesh);
    } catch (err: any) {
      alert("Parse failed: " + (err?.message || err));
      console.error(err);
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <input
        type="file"
        accept=".mef,.ef"
        onChange={onFile}
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          background: "white",
        }}
      />
      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%", border: "1px solid #444" }}
      />
    </div>
  );
};

export default MefViewer;
