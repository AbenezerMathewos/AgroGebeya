import { useEffect, useRef } from 'react';

/**
 * Interactive 3D Undulating Dots Mesh (Vanta.js Dots Effect)
 * Features dynamic color shifting across emerald, mint, cyan, and amber palettes,
 * 3D wave mechanics, and mouse ripple repulsion.
 */
export default function VantaDotsCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking with smooth lerp
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      active: false,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Color palettes to interpolate across (Agricultural Emerald, Mint, Sky Blue, Golden Amber)
    const colorStops = [
      { r: 16, g: 185, b: 129 },  // Mint Emerald
      { r: 52, g: 211, b: 153 },  // Luminous Spring
      { r: 14, g: 165, b: 233 },  // Azure Sky
      { r: 245, g: 158, b: 11 },  // Golden Amber
      { r: 5, g: 150, b: 105 },   // Deep Forest
    ];

    const getColor = (t, offset) => {
      const total = colorStops.length;
      const index = (t + offset) % total;
      const i1 = Math.floor(index);
      const i2 = (i1 + 1) % total;
      const frac = index - i1;

      const c1 = colorStops[i1];
      const c2 = colorStops[i2];

      const r = Math.round(c1.r + (c2.r - c1.r) * frac);
      const g = Math.round(c1.g + (c2.g - c1.g) * frac);
      const b = Math.round(c1.b + (c2.b - c1.b) * frac);

      return { r, g, b };
    };

    let time = 0;
    const spacing = 38; // Grid resolution

    const render = () => {
      time += 0.016;

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;

      // Color cycle time
      const colorTime = time * 0.18;

      // 2D Array to store computed wave points for line connections
      const grid = [];

      for (let r = 0; r < rows; r++) {
        const rowPoints = [];
        const baseY = r * spacing;

        for (let c = 0; c < cols; c++) {
          const baseX = c * spacing;

          // Multi-frequency wave formula for organic 3D undulation
          const wave1 = Math.sin(baseX * 0.007 + time * 1.8 + r * 0.12) * 14;
          const wave2 = Math.cos(baseY * 0.009 + time * 1.4 + c * 0.1) * 10;
          const wave3 = Math.sin((baseX + baseY) * 0.004 + time * 2.2) * 8;

          let posX = baseX;
          let posY = baseY + wave1 + wave2 + wave3;

          // Mouse proximity ripple & push
          const dx = posX - mouse.x;
          const dy = posY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180;

          let scale = 1;
          let alpha = 0.55;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist);
            posY -= force * 24;
            scale += force * 1.3;
            alpha = 0.95;
          }

          // Spatial color mapping
          const spatialOffset = (c * 0.06 + r * 0.08);
          const { r: cr, g: cg, b: cb } = getColor(colorTime, spatialOffset);

          // Dot size proportional to wave height
          const baseRadius = 2.4;
          const radius = Math.max(1.2, (baseRadius + (wave1 + wave2) * 0.09) * scale);

          rowPoints.push({ x: posX, y: posY, r: radius, color: `rgba(${cr}, ${cg}, ${cb}, ${alpha})`, cr, cg, cb, alpha });
        }
        grid.push(rowPoints);
      }

      // Draw subtle connecting mesh lines between adjacent points
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = grid[r][c];

          // Right neighbor line
          if (c + 1 < cols) {
            const right = grid[r][c + 1];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(right.x, right.y);
            ctx.strokeStyle = `rgba(${p.cr}, ${p.cg}, ${p.cb}, ${p.alpha * 0.12})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Bottom neighbor line
          if (r + 1 < rows) {
            const bottom = grid[r + 1][c];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(bottom.x, bottom.y);
            ctx.strokeStyle = `rgba(${p.cr}, ${p.cg}, ${p.cb}, ${p.alpha * 0.12})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw Glowing Dots
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = grid[r][c];

          // Main dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();

          // Soft outer bloom on elevated wave crests
          if (p.r > 2.8) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.cr}, ${p.cg}, ${p.cb}, 0.15)`;
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="vanta-dots-canvas" aria-hidden="true" />;
}
