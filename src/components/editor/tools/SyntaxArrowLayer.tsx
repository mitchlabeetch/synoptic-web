// src/components/editor/tools/SyntaxArrowLayer.tsx
// PURPOSE: Renders professional-grade SVG connectors (arrows) between word groups to visualize linguistic links
// ACTION: Calculates coordinates from Tiptap marks and renders curved SVG paths that avoid text overlap
// MECHANISM: Uses ResizeObserver and MutationObserver to track word movements, then draws bezier curves below the text line

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export type ArrowPathStyle = 'curved' | 'angular' | 'straight';
export type ArrowHeadStyle = 'arrow' | 'dot' | 'diamond' | 'none';

export interface SyntaxArrow {
  id: string;
  sourceGroupId: string;
  targetGroupId: string;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  strokeWidth: number;
  headStyle: ArrowHeadStyle;
  pathStyle: ArrowPathStyle;
  curvature: number; // 0.5 to 2.0
  label?: string;
}

export interface WordGroup {
  id: string;
  wordIds: string[]; // data-syntax-id values
  color: string;
  type: 'subject' | 'verb' | 'object' | 'adjective' | 'adverb' | 'article' | 'custom';
  label?: string;
}

interface ArrowPath {
  id: string;
  d: string;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  strokeWidth: number;
  headStyle: ArrowHeadStyle;
  isSelected: boolean;
}

interface SyntaxArrowLayerProps {
  arrows: SyntaxArrow[];
  wordGroups: WordGroup[];
  containerRef: React.RefObject<HTMLElement | null>;
  selectedArrowId?: string | null;
  onArrowClick?: (arrowId: string, position: { x: number; y: number }) => void;
  className?: string;
}

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

export function SyntaxArrowLayer({
  arrows,
  wordGroups,
  containerRef,
  selectedArrowId,
  onArrowClick,
  className
}: SyntaxArrowLayerProps) {
  const [arrowPaths, setArrowPaths] = useState<ArrowPath[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  // ───────────────────────────────────────
  // PATH CALCULATION
  // ───────────────────────────────────────
  
  const calculatePaths = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const paths: ArrowPath[] = [];

    arrows.forEach(arrow => {
      // Find source and target groups
      const sourceGroup = wordGroups.find(g => g.id === arrow.sourceGroupId);
      const targetGroup = wordGroups.find(g => g.id === arrow.targetGroupId);
      
      if (!sourceGroup || !targetGroup) return;

      // Get bounding rects for source and target word groups
      const sourceRect = getGroupBoundingRect(sourceGroup.wordIds, container, containerRect);
      const targetRect = getGroupBoundingRect(targetGroup.wordIds, container, containerRect);
      
      if (!sourceRect || !targetRect) return;

      // Calculate path based on style
      const pathD = calculatePath(sourceRect, targetRect, arrow.curvature, 0, arrow.pathStyle);
      
      paths.push({
        id: arrow.id,
        d: pathD,
        color: arrow.color,
        style: arrow.style,
        strokeWidth: arrow.strokeWidth,
        headStyle: arrow.headStyle,
        isSelected: selectedArrowId === arrow.id
      });
    });

    setArrowPaths(paths);
  }, [arrows, wordGroups, containerRef, selectedArrowId]);

  // ───────────────────────────────────────
  // OBSERVERS FOR DYNAMIC UPDATES
  // ───────────────────────────────────────
  
  useEffect(() => {
    calculatePaths();
    
    const container = containerRef.current;
    if (!container) return;

    // Debounced update
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculatePaths, 50);
    };

    // Observe DOM changes
    const mutationObserver = new MutationObserver(debouncedUpdate);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-syntax-id']
    });

    // Observe resize
    const resizeObserver = new ResizeObserver(debouncedUpdate);
    resizeObserver.observe(container);

    // Listen for scroll
    container.addEventListener('scroll', debouncedUpdate);
    window.addEventListener('resize', debouncedUpdate);

    return () => {
      clearTimeout(timeoutId);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('scroll', debouncedUpdate);
      window.removeEventListener('resize', debouncedUpdate);
    };
  }, [calculatePaths, containerRef]);

  // ───────────────────────────────────────
  // CLICK HANDLER
  // ───────────────────────────────────────
  
  const handleArrowClick = (arrowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onArrowClick?.(arrowId, { x: e.clientX, y: e.clientY });
  };

  // ───────────────────────────────────────
  // STROKE DASH ARRAY
  // ───────────────────────────────────────
  
  const getDashArray = (style: string) => {
    switch (style) {
      case 'dashed': return '8,4';
      case 'dotted': return '2,4';
      default: return 'none';
    }
  };

  // ───────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────
  
  return (
    <svg
      ref={svgRef}
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none overflow-visible",
        className
      )}
      style={{ zIndex: 10 }}
    >
      <defs>
        {/* Arrow markers for different colors */}
        {arrowPaths.map(path => (
          <marker
            key={`marker-${path.id}`}
            id={`arrowhead-${path.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            {path.headStyle === 'arrow' && (
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={path.isSelected ? '#3b82f6' : path.color}
              />
            )}
            {path.headStyle === 'dot' && (
              <circle 
                cx="5" 
                cy="3.5" 
                r="3" 
                fill={path.isSelected ? '#3b82f6' : path.color} 
              />
            )}
            {path.headStyle === 'diamond' && (
              <polygon
                points="0 3.5, 5 0, 10 3.5, 5 7"
                fill={path.isSelected ? '#3b82f6' : path.color}
              />
            )}
          </marker>
        ))}
      </defs>

      {arrowPaths.map((path, idx) => (
        <g key={`arrow-${path.id}-${idx}`}>
          {/* Invisible wider path for easier clicking */}
          <path
            d={path.d}
            stroke="transparent"
            strokeWidth={path.strokeWidth + 10}
            fill="none"
            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            onClick={(e) => handleArrowClick(path.id, e)}
          />
          {/* Visible arrow path */}
          <path
            d={path.d}
            stroke={path.isSelected ? '#3b82f6' : path.color}
            strokeWidth={path.isSelected ? path.strokeWidth + 1 : path.strokeWidth}
            strokeDasharray={getDashArray(path.style)}
            fill="none"
            markerEnd={path.headStyle !== 'none' ? `url(#arrowhead-${path.id})` : undefined}
            style={{ pointerEvents: 'none' }}
            className="transition-colors duration-150"
          />
        </g>
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════

/**
 * getGroupBoundingRect
 * 
 * PURPOSE: Aggregates the visual boundaries of multiple word elements into a single bounding box.
 * ACTION: Queries DOM for elements with data-syntax-id and computes the union of their rects.
 * MECHANISM: Calculates relative position within the container for accurate arrow placement.
 */
function getGroupBoundingRect(
  wordIds: string[], 
  container: HTMLElement,
  containerRect: DOMRect
): DOMRect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;

  wordIds.forEach(wordId => {
    // Query by data-syntax-id attribute
    const el = container.querySelector(`[data-syntax-id="${wordId}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    
    // Calculate position relative to container
    const x = rect.left - containerRect.left;
    const y = rect.top - containerRect.top;
    const w = rect.width;
    const h = rect.height;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
    found = true;
  });

  if (!found) return null;

  return new DOMRect(minX, minY, maxX - minX, maxY - minY);
}

/**
 * calculateBezierPath
 * 
 * PURPOSE: Generates a smooth cubic bezier curve that avoids intersecting with the text.
 * ACTION: Defines start/end points at the bottom of the words and calculates control points below.
 * MECHANISM: Creates a "U" shape that curves below the text line for legibility.
 */
function calculateBezierPath(
  source: DOMRect,
  target: DOMRect,
  curvature: number,
  index: number = 0
): string {
  // Start point: bottom center of source
  const startX = source.left + source.width / 2;
  const startY = source.top + source.height + 5;

  // End point: bottom center of target
  const endX = target.left + target.width / 2;
  const endY = target.top + target.height + 5;

  // Add jitter offset to prevent overlap
  const offset = (index % 5) * 4;
  
  // Calculate curve depth based on distance
  const distanceX = Math.abs(endX - startX);
  const distanceY = Math.abs(endY - startY);
  const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
  
  // Dynamic depth: flatten short arrows, limit long ones
  let curveDepth = Math.min(80, Math.max(20, distance * 0.2)) * curvature;
  curveDepth += offset;

  // Handle nearly vertical cases
  if (distanceX < 20) {
    curveDepth = 30;
  }

  const cp1Y = Math.max(startY, endY) + curveDepth;
  const cp2Y = Math.max(startY, endY) + curveDepth;
  
  // Spread control points horizontally
  const cp1X = startX + (endX - startX) * 0.2;
  const cp2X = endX - (endX - startX) * 0.2;

  return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
}

/**
 * calculateAngularPath
 * 
 * PURPOSE: Provides a "circuit-board" style connector with 90-degree turns.
 * ACTION: Creates a three-segment line (down → across → up).
 */
function calculateAngularPath(
  source: DOMRect,
  target: DOMRect,
  curvature: number,
  index: number = 0
): string {
  const startX = source.left + source.width / 2;
  const startY = source.top + source.height + 3;
  const endX = target.left + target.width / 2;
  const endY = target.top + target.height + 3;

  const offset = (index % 3) * 6;
  const dropDistance = 15 + Math.abs(curvature) * 10 + offset;
  const midY = Math.max(startY, endY) + dropDistance;

  return `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
}

/**
 * calculateStraightPath
 * 
 * PURPOSE: Simple direct line between source and target.
 */
function calculateStraightPath(source: DOMRect, target: DOMRect): string {
  const startX = source.left + source.width / 2;
  const startY = source.top + source.height + 3;
  const endX = target.left + target.width / 2;
  const endY = target.top + target.height + 3;
  
  return `M ${startX} ${startY} L ${endX} ${endY}`;
}

/**
 * calculatePath - Main path delegation function
 */
function calculatePath(
  source: DOMRect,
  target: DOMRect,
  curvature: number,
  index: number = 0,
  pathStyle: ArrowPathStyle = 'curved'
): string {
  switch (pathStyle) {
    case 'angular':
      return calculateAngularPath(source, target, curvature, index);
    case 'straight':
      return calculateStraightPath(source, target);
    case 'curved':
    default:
      return calculateBezierPath(source, target, curvature, index);
  }
}

export default SyntaxArrowLayer;
