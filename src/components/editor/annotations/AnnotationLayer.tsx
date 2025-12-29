// src/components/editor/annotations/AnnotationLayer.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useProjectStore } from '@/lib/store/projectStore';

export function AnnotationLayer() {
  const arrows = useProjectStore((state) => state.content.arrows);
  const [svgPaths, setSvgPaths] = useState<any[]>([]);
  const containerRef = useRef<SVGSVGElement>(null);

  const calculatePaths = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const newPaths = arrows.map((arrow) => {
      const sourceId = `${arrow.blockId}-${arrow.source.language}-${arrow.source.wordIndices[0]}`;
      const targetId = `${arrow.blockId}-${arrow.target.language}-${arrow.target.wordIndices[0]}`;
      
      const sourceEl = document.querySelector(`[data-word-id="${sourceId}"]`);
      const targetEl = document.querySelector(`[data-word-id="${targetId}"]`);
      
      if (!sourceEl || !targetEl) return null;
      
      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      
      // Calculate centers relative to SVG container
      const x1 = (sourceRect.left + sourceRect.right) / 2 - containerRect.left;
      const y1 = (sourceRect.top + sourceRect.bottom) / 2 - containerRect.top;
      const x2 = (targetRect.left + targetRect.right) / 2 - containerRect.left;
      const y2 = (targetRect.top + targetRect.bottom) / 2 - containerRect.top;
      
      // Draw a quadratic bezier curve
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 - 20; // Slight curve upwards
      
      return {
        id: arrow.id,
        path: `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`,
        color: arrow.color || '#3b82f6'
      };
    }).filter(Boolean);
    
    setSvgPaths(newPaths);
  };

  useEffect(() => {
    calculatePaths();
    window.addEventListener('resize', calculatePaths);
    
    // Also listen for changes in the workspace (blocks moving, text changing)
    const observer = new MutationObserver(calculatePaths);
    const workspace = document.getElementById('editor-workspace');
    if (workspace) {
      observer.observe(workspace, { childList: true, subtree: true, characterData: true });
    }

    return () => {
      window.removeEventListener('resize', calculatePaths);
      observer.disconnect();
    };
  }, [arrows]);

  return (
    <svg 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-50 w-full h-full overflow-visible"
      style={{ minHeight: '100%' }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
        </marker>
      </defs>
      
      {svgPaths.map((p) => (
        <path
          key={p.id}
          d={p.path}
          stroke={p.color}
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrowhead)"
          className="opacity-40 animate-in fade-in duration-500"
          strokeDasharray="4 2"
        />
      ))}
    </svg>
  );
}
