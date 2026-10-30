import React, { useRef, useEffect } from 'react';

export type WaveMode = 'harmonic' | 'vortex' | 'pulse' | 'matrix';

export interface FractalDotGridProps {
  dotSize?: number;
  dotSpacing?: number;
  dotOpacity?: number;
  waveIntensity?: number;
  waveRadius?: number;
  waveSpeed?: number;
  waveMode?: WaveMode;
  dotColor?: string;
  glowColor?: string;
  enableNoise?: boolean;
  noiseOpacity?: number;
  enableMouseGlow?: boolean;
  enableClickRipples?: boolean;
  enableLines?: boolean;
  initialPerformance?: 'low' | 'medium' | 'high';
  className?: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  intensity: number;
  speed: number;
}

export const FractalDotGrid: React.FC<FractalDotGridProps> = ({
  dotSize = 5.5,
  dotSpacing = 16,
  dotOpacity = 0.7,
  waveIntensity = 85,
  waveRadius = 240,
  waveSpeed = 1.0,
  waveMode = 'harmonic',
  dotColor = 'rgba(99, 102, 241, 1)',
  glowColor = 'rgba(129, 140, 248, 0.9)',
  enableNoise = false,
  noiseOpacity = 0.04,
  enableMouseGlow = true,
  enableClickRipples = true,
  enableLines = false,
  initialPerformance = 'high',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const animFrameRef = useRef<number>(0);
  const mousePosRef = useRef<{
    x: number;
    y: number;
    isHovering: boolean;
    targetX: number;
    targetY: number;
  }>({
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    isHovering: false,
  });
  const ripplesRef = useRef<Ripple[]>([]);
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Performance multipliers
  const perfMultiplier =
    initialPerformance === 'low' ? 1.4 : initialPerformance === 'medium' ? 1.15 : 1.0;
  const effectiveSpacing = Math.max(9, dotSpacing * perfMultiplier);

  // Generate static procedural noise tile
  useEffect(() => {
    if (!enableNoise) {
      noiseCanvasRef.current = null;
      return;
    }
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 128;
    noiseCanvas.height = 128;
    const ctx = noiseCanvas.getContext('2d');
    if (ctx) {
      const imgData = ctx.createImageData(128, 128);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const val = Math.floor(Math.random() * 255);
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = Math.floor(255 * noiseOpacity);
      }
      ctx.putImageData(imgData, 0, 0);
      noiseCanvasRef.current = noiseCanvas;
    }
  }, [enableNoise, noiseOpacity]);

  // Main animation engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    if (initialPerformance === 'low') dpr = 1;

    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001 * waveSpeed;

      // Smooth mouse lerp interpolation for silky motion
      const mouse = mousePosRef.current;
      if (mouse.isHovering) {
        mouse.x += (mouse.targetX - mouse.x) * 0.2;
        mouse.y += (mouse.targetY - mouse.y) * 0.2;
      }

      ctx.clearRect(0, 0, width, height);

      // Advance kinetic shockwave ripples
      if (enableClickRipples && ripplesRef.current.length > 0) {
        ripplesRef.current.forEach((r) => {
          r.radius += r.speed;
          r.intensity *= 0.985;
        });
        ripplesRef.current = ripplesRef.current.filter(
          (r) => r.radius < r.maxRadius && r.intensity > 0.02,
        );
      }

      const effectiveWaveRadius = Math.max(50, waveRadius);
      const intensityScale = waveIntensity / 100;

      const cols = Math.ceil(width / effectiveSpacing) + 2;
      const rows = Math.ceil(height / effectiveSpacing) + 2;
      const offsetX = (width % effectiveSpacing) / 2;
      const offsetY = (height % effectiveSpacing) / 2;

      // Track active points for constellation mesh lines
      const activePoints: Array<{ x: number; y: number; energy: number }> = [];

      for (let r = -1; r <= rows; r++) {
        const baseY = r * effectiveSpacing + offsetY;

        for (let c = -1; c <= cols; c++) {
          const baseX = c * effectiveSpacing + offsetX;

          let waveOffset = 0;

          // Wave algorithms based on waveMode
          if (waveMode === 'harmonic') {
            const distToCenter = Math.hypot(baseX - width / 2, baseY - height / 2);
            const w1 = Math.sin(distToCenter * 0.012 - elapsed * 2.2);
            const w2 = Math.cos(baseX * 0.018 + baseY * 0.018 + elapsed * 1.6);
            const w3 = Math.sin((baseX * 0.008 - elapsed) * Math.cos(baseY * 0.008));
            waveOffset = (w1 * 0.5 + w2 * 0.35 + w3 * 0.15) * (intensityScale * 18);
          } else if (waveMode === 'vortex') {
            const dx = baseX - (mouse.isHovering ? mouse.x : width / 2);
            const dy = baseY - (mouse.isHovering ? mouse.y : height / 2);
            const angle = Math.atan2(dy, dx);
            const dist = Math.hypot(dx, dy);
            const swirl = Math.sin(angle * 3 + dist * 0.02 - elapsed * 3.0);
            waveOffset = swirl * (intensityScale * 22);
          } else if (waveMode === 'pulse') {
            // Heartbeat systolic rhythm
            const pulsePhase = (elapsed * 2.5) % (Math.PI * 2);
            const heartbeat = Math.pow(Math.sin(pulsePhase), 6) * Math.sin(pulsePhase * 3);
            const distToCenter = Math.hypot(baseX - width / 2, baseY - height / 2);
            const wave = Math.sin(distToCenter * 0.018 - elapsed * 3.5);
            waveOffset = (wave * 0.6 + heartbeat * 0.8) * (intensityScale * 20);
          } else if (waveMode === 'matrix') {
            // Digital rain flow
            const colSpeed = Math.sin(c * 17.3) * 0.5 + 1.2;
            const rain = Math.sin(baseY * 0.025 - elapsed * 4.0 * colSpeed);
            waveOffset = (rain > 0.4 ? rain * 1.5 : rain * 0.3) * (intensityScale * 16);
          }

          // Mouse Proximity Interaction
          let mouseInfluence = 0;
          if (mouse.isHovering) {
            const dx = baseX - mouse.x;
            const dy = baseY - mouse.y;
            const distToMouse = Math.hypot(dx, dy);

            if (distToMouse < effectiveWaveRadius) {
              const normDist = 1 - distToMouse / effectiveWaveRadius;
              mouseInfluence = Math.pow(normDist, 2);
              const pushFactor = Math.sin(normDist * Math.PI) * (intensityScale * 24);
              waveOffset += pushFactor;
            }
          }

          // Dynamic Click Ripples
          if (enableClickRipples && ripplesRef.current.length > 0) {
            for (let i = 0; i < ripplesRef.current.length; i++) {
              const ripple = ripplesRef.current[i];
              const dist = Math.hypot(baseX - ripple.x, baseY - ripple.y);
              const distDiff = Math.abs(dist - ripple.radius);
              if (distDiff < 50) {
                const rippleFactor = (1 - distDiff / 50) * ripple.intensity * (intensityScale * 30);
                waveOffset += rippleFactor;
              }
            }
          }

          const finalY = baseY + waveOffset * 0.38;
          const finalX = baseX;

          const normalizedEnergy = Math.max(
            0,
            Math.min(1, (waveOffset + 18) / 36 + mouseInfluence * 0.7),
          );
          const currentRadius = Math.max(0.75, dotSize * 0.5 * (0.55 + normalizedEnergy * 0.95));
          const currentOpacity = Math.max(
            0.08,
            Math.min(1, dotOpacity * (0.35 + normalizedEnergy * 0.85)),
          );

          // Collect for lines if enabled
          if (enableLines && normalizedEnergy > 0.45) {
            activePoints.push({ x: finalX, y: finalY, energy: normalizedEnergy });
          }

          // Draw the dot
          ctx.beginPath();
          ctx.arc(finalX, finalY, currentRadius, 0, Math.PI * 2);

          // Color calculation
          if (mouseInfluence > 0.15 || normalizedEnergy > 0.7) {
            ctx.fillStyle = glowColor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = Math.min(16, dotSize * 1.5 * (mouseInfluence + normalizedEnergy));
          } else {
            ctx.fillStyle = dotColor;
            ctx.shadowBlur = 0;
          }

          ctx.globalAlpha = currentOpacity;
          ctx.fill();
        }
      }

      // Draw constellation connective lines
      if (enableLines && activePoints.length > 0) {
        ctx.shadowBlur = 0;
        const maxDist = effectiveSpacing * 1.45;
        for (let i = 0; i < activePoints.length; i++) {
          for (let j = i + 1; j < activePoints.length; j++) {
            const p1 = activePoints[i];
            const p2 = activePoints[j];
            const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (d < maxDist) {
              const lineAlpha = (1 - d / maxDist) * 0.25 * Math.min(p1.energy, p2.energy);
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = glowColor;
              ctx.globalAlpha = lineAlpha;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }

      // Draw Mouse Ambient Glow Aura
      if (enableMouseGlow && mouse.isHovering && mouse.x > 0 && mouse.y > 0) {
        const auraGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          effectiveWaveRadius * 1.1,
        );
        auraGrad.addColorStop(0, glowColor);
        auraGrad.addColorStop(0.4, glowColor.replace(/[\d.]+\)$/, '0.12)'));
        auraGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.globalAlpha = 0.35;
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, effectiveWaveRadius * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Overlay Procedural Noise
      if (enableNoise && noiseCanvasRef.current) {
        ctx.globalAlpha = noiseOpacity;
        const pattern = ctx.createPattern(noiseCanvasRef.current, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, width, height);
        }
      }

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [
    dotSize,
    effectiveSpacing,
    dotOpacity,
    waveIntensity,
    waveRadius,
    waveSpeed,
    waveMode,
    dotColor,
    glowColor,
    enableNoise,
    noiseOpacity,
    enableMouseGlow,
    enableClickRipples,
    enableLines,
    initialPerformance,
  ]);

  // Pointer event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePosRef.current = {
      ...mousePosRef.current,
      targetX: e.clientX - rect.left,
      targetY: e.clientY - rect.top,
      isHovering: true,
    };
    if (mousePosRef.current.x < -1000) {
      mousePosRef.current.x = mousePosRef.current.targetX;
      mousePosRef.current.y = mousePosRef.current.targetY;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMouseMove(e);
  };

  const handleMouseLeave = () => {
    mousePosRef.current.isHovering = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableClickRipples || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ripplesRef.current.push({
      x,
      y,
      radius: 5,
      maxRadius: Math.max(260, waveRadius * 1.4),
      intensity: 1.0,
      speed: 6.5,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative w-full h-full overflow-hidden select-none cursor-crosshair ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
};
