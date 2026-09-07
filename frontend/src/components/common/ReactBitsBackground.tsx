import React, { useRef, useEffect, useState } from "react";

interface ReactBitsBackgroundProps {
  variant?: "squares" | "particles" | "waves";
  speed?: number;
  squareSize?: number;
  direction?: "diagonal" | "right" | "left" | "up" | "down";
  className?: string;
}

interface HoveredSquare {
  x: number;
  y: number;
  opacity: number;
  color?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  opacity: number;
}

export const ReactBitsBackground: React.FC<ReactBitsBackgroundProps> = ({
  variant = "squares",
  speed = 0.4,
  squareSize = 44,
  direction = "diagonal",
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : true,
  );

  // Watch for theme toggle changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = container.offsetWidth);
    let height = (canvas.height = container.offsetHeight);

    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.offsetWidth;
      height = canvas.height = container.offsetHeight;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Mouse tracking
    let mousePos = { x: -1000, y: -1000 };
    let isMouseInside = false;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      isMouseInside = true;
    };

    const onMouseLeave = () => {
      mousePos = { x: -1000, y: -1000 };
      isMouseInside = false;
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    // --- SQUARES VARIANT STATE ---
    let gridOffset = { x: 0, y: 0 };
    let activeSquares: Map<string, HoveredSquare> = new Map();
    let randomPulseTimer = 0;

    // --- PARTICLES VARIANT STATE ---
    const particleCount = Math.min(Math.floor((width * height) / 12000), 75);
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1.2,
        baseRadius: Math.random() * 2 + 1.2,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    // --- RENDER LOOP ---
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (variant === "squares") {
        // Compute movement offset
        const moveStep = speed;
        if (direction === "diagonal") {
          gridOffset.x = (gridOffset.x + moveStep) % squareSize;
          gridOffset.y = (gridOffset.y + moveStep) % squareSize;
        } else if (direction === "right") {
          gridOffset.x = (gridOffset.x + moveStep) % squareSize;
        } else if (direction === "down") {
          gridOffset.y = (gridOffset.y + moveStep) % squareSize;
        }

        // Palette config
        const gridBorderColor = isDark
          ? "rgba(51, 65, 85, 0.28)" // Slate-700 subtle
          : "rgba(203, 213, 225, 0.55)"; // Slate-300 clean
        const hoverAmberColor = isDark
          ? "rgba(245, 158, 11, 0.16)" // Warm Amber glow
          : "rgba(217, 119, 6, 0.12)";
        const accentCyanColor = isDark
          ? "rgba(56, 189, 248, 0.12)"
          : "rgba(2, 132, 199, 0.08)";

        // Draw grid lines
        ctx.strokeStyle = gridBorderColor;
        ctx.lineWidth = 1;

        const startX = (gridOffset.x % squareSize) - squareSize;
        const startY = (gridOffset.y % squareSize) - squareSize;

        ctx.beginPath();
        for (let x = startX; x <= width + squareSize; x += squareSize) {
          ctx.moveTo(Math.floor(x) + 0.5, 0);
          ctx.lineTo(Math.floor(x) + 0.5, height);
        }
        for (let y = startY; y <= height + squareSize; y += squareSize) {
          ctx.moveTo(0, Math.floor(y) + 0.5);
          ctx.lineTo(width, Math.floor(y) + 0.5);
        }
        ctx.stroke();

        // Detect square under mouse & add to active hover map
        if (isMouseInside && mousePos.x >= 0 && mousePos.y >= 0) {
          const col = Math.floor((mousePos.x - startX) / squareSize);
          const row = Math.floor((mousePos.y - startY) / squareSize);
          const sqX = startX + col * squareSize;
          const sqY = startY + row * squareSize;

          const key = `${col}_${row}`;
          activeSquares.set(key, {
            x: sqX,
            y: sqY,
            opacity: 1.0,
            color: (col + row) % 3 === 0 ? accentCyanColor : hoverAmberColor,
          });

          // Also gently illuminate 2 neighbor squares for a subtle organic bloom
          const neighborOffsets = [
            { dc: 1, dr: 0 },
            { dc: -1, dr: 0 },
            { dc: 0, dr: 1 },
            { dc: 0, dr: -1 },
          ];
          neighborOffsets.forEach(({ dc, dr }) => {
            const nCol = col + dc;
            const nRow = row + dr;
            const nKey = `${nCol}_${nRow}`;
            if (!activeSquares.has(nKey)) {
              activeSquares.set(nKey, {
                x: startX + nCol * squareSize,
                y: startY + nRow * squareSize,
                opacity: 0.45,
                color: hoverAmberColor,
              });
            }
          });
        }

        // Random passive ambient twinkling squares
        randomPulseTimer++;
        if (randomPulseTimer % 45 === 0) {
          const randomCol = Math.floor(Math.random() * (width / squareSize));
          const randomRow = Math.floor(Math.random() * (height / squareSize));
          const rKey = `rand_${randomCol}_${randomRow}`;
          if (!activeSquares.has(rKey)) {
            activeSquares.set(rKey, {
              x: startX + randomCol * squareSize,
              y: startY + randomRow * squareSize,
              opacity: 0.7,
              color: Math.random() > 0.4 ? hoverAmberColor : accentCyanColor,
            });
          }
        }

        // Render & decay active square fills
        activeSquares.forEach((sq, key) => {
          if (sq.opacity <= 0.02) {
            activeSquares.delete(key);
            return;
          }

          ctx.save();
          ctx.fillStyle = sq.color || hoverAmberColor;
          ctx.globalAlpha = sq.opacity;
          ctx.fillRect(sq.x + 1, sq.y + 1, squareSize - 1, squareSize - 1);

          // Subtle bright border highlight
          ctx.strokeStyle = isDark
            ? `rgba(245, 158, 11, ${sq.opacity * 0.4})`
            : `rgba(217, 119, 6, ${sq.opacity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(sq.x + 0.5, sq.y + 0.5, squareSize, squareSize);
          ctx.restore();

          // Decay opacity
          sq.opacity *= 0.94;
        });
      } else if (variant === "particles") {
        // STATISTICAL DATA CONSTELLATION MESH
        const nodeColor = isDark
          ? "rgba(245, 158, 11, " // Saffron / Amber
          : "rgba(217, 119, 6, ";
        const lineColor = isDark
          ? "rgba(148, 163, 184, " // Slate lines
          : "rgba(100, 116, 139, ";

        // Update & draw particles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          // Mouse attraction / interaction
          if (isMouseInside) {
            const dx = mousePos.x - p.x;
            const dy = mousePos.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              p.x -= (dx / dist) * 1.5;
              p.y -= (dy / dist) * 1.5;
            }
          }

          // Draw node
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${nodeColor}${p.opacity})`;
          ctx.fill();

          // Draw interconnecting lines
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 110) {
              const alpha = (1 - dist / 110) * (isDark ? 0.22 : 0.16);
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `${lineColor}${alpha})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [variant, speed, squareSize, direction, isDark]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ pointerEvents: "none" }}
      />
      {/* Radial vignette fade for seamless blending */}
      <div className="absolute inset-0 mask-radial-fade bg-transparent pointer-events-none" />
    </div>
  );
};
