import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GraphNode, GraphEdge } from '@/types/plagiarism';

interface ClusterVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function ClusterVisualization({ nodes, edges }: ClusterVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Cluster colors
    const clusterColors = [
      0x8b5cf6, // Purple
      0x14b8a6, // Teal
      0xf97316, // Orange
      0xec4899, // Pink
      0x3b82f6, // Blue
    ];

    // Create nodes (spheres)
    const nodeObjects = new Map<string, THREE.Mesh>();
    nodes.forEach(node => {
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const color = node.cluster >= 0 
        ? clusterColors[node.cluster % clusterColors.length]
        : 0x666666;
      const material = new THREE.MeshPhongMaterial({ 
        color,
        emissive: color,
        emissiveIntensity: 0.2,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(node.x, node.y, node.z);
      scene.add(sphere);
      nodeObjects.set(node.id, sphere);

      // Add label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = 'white';
      context.font = 'Bold 20px Arial';
      context.textAlign = 'center';
      context.fillText(node.name.substring(0, 15), 128, 35);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(node.x, node.y + 1, node.z);
      sprite.scale.set(2, 0.5, 1);
      scene.add(sprite);
    });

    // Create edges (lines)
    edges.forEach(edge => {
      const sourceNode = nodeObjects.get(edge.source);
      const targetNode = nodeObjects.get(edge.target);
      
      if (sourceNode && targetNode) {
        const points = [
          sourceNode.position,
          targetNode.position
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Color based on similarity
        const color = new THREE.Color();
        const hue = (edge.similarity / 100) * 0.33; // 0 = red, 0.33 = green
        color.setHSL(hue, 0.8, 0.5);
        
        const material = new THREE.LineBasicMaterial({ 
          color,
          opacity: Math.min(edge.similarity / 100, 0.6),
          transparent: true
        });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
      }
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      
      // Rotate scene slightly
      scene.rotation.y += 0.001;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [nodes, edges]);

  return (
    <div ref={containerRef} className="w-full h-[600px] rounded-xl overflow-hidden shadow-elevated" />
  );
}
