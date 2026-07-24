import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

const GlobeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Re-adjust on resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate sphere points
    const points: Point3D[] = [];
    const count = 350;
    const radius = Math.min(width, height) * 0.35;

    for (let i = 0; i < count; i++) {
      // Golden spiral distribution
      const theta = Math.acos(-1 + (2 * i) / count);
      const phi = Math.sqrt(count * Math.PI) * theta;

      points.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
      });
    }

    let angleX = 0.002;
    let angleY = 0.003;
    
    // Mouse interaction parameters
    let mouseX = 0;
    let mouseY = 0;
    let targetAngleX = 0.002;
    let targetAngleY = 0.003;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;
      
      targetAngleY = (x / width) * 0.015;
      targetAngleX = (y / height) * 0.015;
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    // Rotate points
    const rotateX = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x,
        y: point.y * cos - point.z * sin,
        z: point.y * sin + point.z * cos,
      };
    };

    const rotateY = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x * cos + point.z * sin,
        y: point.y,
        z: -point.x * sin + point.z * cos,
      };
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate rotation speed towards mouse target
      angleX += (targetAngleX - angleX) * 0.05;
      angleY += (targetAngleY - angleY) * 0.05;

      // Project and draw points
      const projected = points.map((p, index) => {
        // Apply rotations
        const rotatedX = rotateX(p, angleX * index * 0.001);
        const rotated = rotateY(rotatedX, angleY * index * 0.002);
        
        // Simple perspective projection
        const cameraDistance = radius * 2.5;
        const scale = cameraDistance / (cameraDistance - rotated.z);
        const projX = rotated.x * scale + width / 2;
        const projY = rotated.y * scale + height / 2;

        return { x: projX, y: projY, z: rotated.z, scale };
      });

      // Draw connections/mesh lines between close points
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.04)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = dx * dx + dy * dy;

          // Only draw lines for close particles to create a beautiful mesh
          if (dist < 2200) {
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw points
      projected.forEach((p) => {
        // Color based on depth/z index
        const alpha = Math.max(0.1, (p.z + radius) / (radius * 2));
        ctx.fillStyle = `rgba(167, 139, 250, ${alpha * 0.7})`;
        
        ctx.beginPath();
        // Dot size based on perspective scale
        const size = Math.max(1, p.scale * 1.3);
        ctx.arc(p.x, p.y, size, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw small glowing core for closer particles
        if (p.z > radius * 0.3) {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 0.4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-45" />;
};

export default GlobeCanvas;
