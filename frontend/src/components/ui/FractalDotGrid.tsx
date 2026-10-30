import React, { useRef, useEffect } from 'react';

export interface FractalDotGridProps {
  dotSize?: number;
  dotSpacing?: number;
  dotOpacity?: number;
  waveIntensity?: number;
  waveRadius?: number;
  waveSpeed?: number;
  dotColor?: string;
  glowColor?: string;
  enableNoise?: boolean;
  noiseOpacity?: number;
  enableMouseGlow?: boolean;
  enableClickRipples?: boolean;
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
  waveIntensity = 80,
  waveRadius = 220,
  waveSpeed = 1.0,
  dotColor = 'rgba(99, 102, 241, 1)',
  glowColor = 'rgba(129, 140, 248, 0.9)',
  enableNoise = false,
  noiseOpacity = 0.04,
  enableMouseGlow = true,
  enableClickRipples = true,
  initialPerformance = 'high',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation & interaction refs to prevent unnecessary re-binds
  const animFrameRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number; isHovering: boolean }>({
    x: -9999,
    y: -9999,
    isHovering: false,
  });
  const ripplesRef = useRef<Ripple[]>([]);
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Performance settings
  const perfMultiplier = initialPerformance === 'low' ? 1.4 : initialPerformance === 'medium' ? 1.15 : 1.0;
  const effectiveSpacing = Math.max(8, dotSpacing * perfMultiplier);

  // Generate static noise tile if noise enabled
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

  // Main canvas animation loop
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

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001 * waveSpeed;

      ctx.clearRect(0, 0, width, height);

      // Update ripples
      if (enableClickRipples && ripplesRef.current.length > 0) {
        ripplesRef.current.forEach((r) => {
          r.radius += r.speed;
          r.intensity *= 0.982;
        });
        ripplesRef.current = ripplesRef.current.filter(
          (r) => r.radius < r.maxRadius && r.intensity > 0.01
        );
      }

      const mouse = mousePosRef.current;
      const effectiveWaveRadius = Math.max(50, waveRadius);
      const intensityScale = (waveIntensity / 100);

      // Grid bounds
      const cols = Math.ceil(width / effectiveSpacing) + 2;
      const rows = Math.ceil(height / effectiveSpacing) + 2;
      const offsetX = (width % effectiveSpacing) / 2;
      const offsetY = (height % effectiveSpacing) / 2;

      // Draw dots
      for (let r = -1; r <= rows; r++) {
        const baseY = r * effectiveSpacing + offsetY;

        for (let c = -1; c <= cols; c++) {
          const baseX = c * effectiveSpacing + offsetX;

          // 1. Fractal Wave Simulation (multi-frequency harmonic dispersion)
          const distToCenter = Math.hypot(baseX - width / 2, baseY - height / 2);
          const fractalWave1 = Math.sin(distToCenter * 0.012 - elapsed * 2.2);
          const fractalWave2 = Math.cos((baseX * 0.02) + (baseY * 0.02) + elapsed * 1.5);
          const fractalWave3 = Math.sin((baseX * 0.008 - elapsed) * Math.cos(baseY * 0.008));

          // Base oscillation
          let waveOffset = (fractalWave1 * 0.5 + fractalWave2 * 0.3 + fractalWave3 * 0.2) * (intensityScale * 14);

          // 2. Mouse Proximity Interaction & Wave Distortion
          let mouseInfluence = 0;
          if (mouse.isHovering) {
            const dx = baseX - mouse.x;
            const dy = baseY - mouse.y;
            const distToMouse = Math.hypot(dx, dy);

            if (distToMouse < effectiveWaveRadius) {
              const normDist = 1 - distToMouse / effectiveWaveRadius;
              mouseInfluence = Math.pow(normDist, 2);

              // Organic radial displacement
              const pushFactor = Math.sin(normDist * Math.PI) * (intensityScale * 18);
              waveOffset += pushFactor;
            }
          }

          // 3. Dynamic Click Ripples
          if (enableClickRipples && ripplesRef.current.length > 0) {
            for (let i = 0; i < ripplesRef.current.length; i++) {
              const ripple = ripplesRef.current[i];
              const dist = Math.hypot(baseX - ripple.x, baseY - ripple.y);
              const distDiff = Math.abs(dist - ripple.radius);
              if (distDiff < 45) {
                const rippleFactor = (1 - distDiff / 45) * ripple.intensity * (intensityScale * 25);
                waveOffset += rippleFactor;
              }
            }
          }

          // Dot size modulated by local energy
          const normalizedEnergy = Math.max(0, Math.min(1, (waveOffset + 15) / 30 + mouseInfluence * 0.6));
          const currentRadius = Math.max(0.8, (dotSize * 0.5) * (0.6 + normalizedEnergy * 0.9));
          const currentOpacity = Math.max(0.1, Math.min(1, dotOpacity * (0.4 + normalizedEnergy * 0.8)));

          // Draw the dot
          ctx.beginPath();
          ctx.arc(baseX, baseY + waveOffset * 0.35, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.globalAlpha = currentOpacity;
          ctx.fill();

          // Mouse highlight glow on neighboring dots
          if (enableMouseGlow && mouseInfluence > 0.1) {
            ctx.beginPath();
            ctx.arc(baseX, baseY + waveOffset * 0.35, currentRadius * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = mouseInfluence * 0.35;
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = 1.0;

      // Draw noise texture overlay if enabled
      if (enableNoise && noiseCanvasRef.current) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const pattern = ctx.createPattern(noiseCanvasRef.current, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
      }

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
    dotColor,
    glowColor,
    enableNoise,
    enableMouseGlow,
    enableClickRipples,
    initialPerformance,
  ]);

  // Handle cursor interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isHovering: true,
    };
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
      radius: 0,
      maxRadius: Math.max(rect.width, rect.height) * 0.85,
      intensity: 1.0,
      speed: 8.5 * (waveSpeed || 1),
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative w-full h-full overflow-hidden select-none cursor-crosshair ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
export default FractalDotGrid;
