import * as THREE from 'three';

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function noise2d(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() - 0.5) * intensity;
    img.data[i] += v;
    img.data[i + 1] += v;
    img.data[i + 2] += v;
  }
  ctx.putImageData(img, 0, 0);
}

export function createGoldBrickTexture(): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = createCanvas(size, size);

  ctx.fillStyle = '#8a7020';
  ctx.fillRect(0, 0, size, size);

  const brickW = size / 4;
  const brickH = size / 6;
  const gap = 3;

  for (let row = 0; row < 7; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let col = -1; col < 5; col++) {
      const x = col * brickW + offset;
      const y = row * brickH;

      const baseR = 160 + Math.random() * 30;
      const baseG = 130 + Math.random() * 25;
      const baseB = 30 + Math.random() * 15;
      ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
      ctx.fillRect(x + gap, y + gap, brickW - gap * 2, brickH - gap * 2);

      const edgeR = baseR * 0.65;
      const edgeG = baseG * 0.65;
      const edgeB = baseB * 0.65;
      ctx.strokeStyle = `rgb(${edgeR},${edgeG},${edgeB})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + gap, y + gap, brickW - gap * 2, brickH - gap * 2);

      const highlightR = Math.min(255, baseR + 35);
      const highlightG = Math.min(255, baseG + 30);
      const highlightB = Math.min(255, baseB + 15);
      ctx.fillStyle = `rgba(${highlightR},${highlightG},${highlightB},0.3)`;
      ctx.fillRect(x + gap + 2, y + gap + 2, brickW - gap * 2 - 4, (brickH - gap * 2) * 0.3);

      const shadowR = baseR * 0.5;
      const shadowG = baseG * 0.5;
      const shadowB = baseB * 0.5;
      ctx.fillStyle = `rgba(${shadowR},${shadowG},${shadowB},0.25)`;
      ctx.fillRect(x + gap + 2, y + brickH - gap - 4, brickW - gap * 2 - 4, 3);

      for (let d = 0; d < 3; d++) {
        const dx = x + gap + Math.random() * (brickW - gap * 2);
        const dy = y + gap + Math.random() * (brickH - gap * 2);
        const ds = 1 + Math.random() * 2;
        ctx.fillStyle = `rgba(${highlightR},${highlightG},${highlightB},0.2)`;
        ctx.fillRect(dx, dy, ds, ds);
      }
    }
  }

  noise2d(ctx, size, size, 12);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.needsUpdate = true;
  return tex;
}

export function createStoneMossTexture(): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = createCanvas(size, size);

  const baseGrad = ctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#4a4a3a');
  baseGrad.addColorStop(0.5, '#555545');
  baseGrad.addColorStop(1, '#484838');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const stones: { x: number; y: number; w: number; h: number }[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sx = col * (size / 8) + (Math.random() - 0.5) * 12;
      const sy = row * (size / 8) + (Math.random() - 0.5) * 12;
      const sw = size / 8 + (Math.random() - 0.5) * 14;
      const sh = size / 8 + (Math.random() - 0.5) * 14;
      stones.push({ x: sx, y: sy, w: sw, h: sh });
    }
  }

  for (const s of stones) {
    const baseG = 60 + Math.random() * 30;
    const baseR = baseG + Math.random() * 10 - 5;
    const baseB = baseG - 10 + Math.random() * 8;
    const variation = Math.random() * 15;

    ctx.fillStyle = `rgb(${baseR + variation},${baseG + variation},${baseB + variation})`;
    ctx.beginPath();
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const pts = 7 + Math.floor(Math.random() * 3);
    for (let p = 0; p < pts; p++) {
      const angle = (p / pts) * Math.PI * 2;
      const rx = s.w / 2 * (0.8 + Math.random() * 0.4);
      const ry = s.h / 2 * (0.8 + Math.random() * 0.4);
      const px = cx + Math.cos(angle) * rx;
      const py = cy + Math.sin(angle) * ry;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(${baseR * 0.4},${baseG * 0.4},${baseB * 0.4},0.6)`;
    ctx.lineWidth = 1.5 + Math.random() * 1.5;
    ctx.stroke();

    const hlR = Math.min(255, baseR + 30 + variation);
    const hlG = Math.min(255, baseG + 35 + variation);
    const hlB = Math.min(255, baseB + 20 + variation);
    ctx.strokeStyle = `rgba(${hlR},${hlG},${hlB},0.25)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x + 3, s.y + 3);
    ctx.lineTo(s.x + s.w - 3, s.y + 3);
    ctx.stroke();

    const sdR = baseR * 0.5;
    const sdG = baseG * 0.5;
    const sdB = baseB * 0.5;
    ctx.strokeStyle = `rgba(${sdR},${sdG},${sdB},0.3)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x + 3, s.y + s.h - 2);
    ctx.lineTo(s.x + s.w - 3, s.y + s.h - 2);
    ctx.stroke();
  }

  for (let i = 0; i < 60; i++) {
    const x1 = Math.random() * size;
    const y1 = Math.random() * size;
    ctx.strokeStyle = `rgba(35,35,25,${0.2 + Math.random() * 0.3})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    let cx = x1, cy = y1;
    for (let j = 0; j < 4 + Math.floor(Math.random() * 3); j++) {
      cx += (Math.random() - 0.5) * 30;
      cy += (Math.random() - 0.5) * 25;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 5 + Math.random() * 20;
    const green = 35 + Math.random() * 55;
    const alpha = 0.08 + Math.random() * 0.22;
    ctx.fillStyle = `rgba(${green * 0.35},${green},${green * 0.25},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 6;
    const g = 30 + Math.random() * 40;
    ctx.fillStyle = `rgba(${g * 0.3},${g},${g * 0.2},${0.2 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 4 + Math.random() * 12;
    const h = 2 + Math.random() * 5;
    ctx.fillStyle = `rgba(25,55,20,${0.1 + Math.random() * 0.15})`;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }

  noise2d(ctx, size, size, 8);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

export function createWoodPlankTexture(): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = createCanvas(size, size);

  ctx.fillStyle = '#3a2510';
  ctx.fillRect(0, 0, size, size);

  const plankCount = 7;
  const plankH = size / plankCount;

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    const baseR = 70 + Math.random() * 25;
    const baseG = 45 + Math.random() * 15;
    const baseB = 20 + Math.random() * 10;
    ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
    ctx.fillRect(0, y + 1, size, plankH - 2);

    for (let l = 0; l < 15; l++) {
      const ly = y + Math.random() * plankH;
      const lw = 0.5 + Math.random() * 1.5;
      ctx.strokeStyle = `rgba(${baseR * 0.6},${baseG * 0.6},${baseB * 0.6},0.3)`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      let lx = 0;
      while (lx < size) {
        lx += 10 + Math.random() * 30;
        ctx.lineTo(lx, ly + (Math.random() - 0.5) * 3);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = '#1a0e05';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + plankH);
    ctx.lineTo(size, y + plankH);
    ctx.stroke();

    ctx.strokeStyle = `rgba(${baseR + 20},${baseG + 15},${baseB + 10},0.15)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 2);
    ctx.lineTo(size, y + 2);
    ctx.stroke();

    for (let n = 0; n < 3; n++) {
      const nx = Math.random() * size;
      const ny = y + 5 + Math.random() * (plankH - 10);
      const nr = 2 + Math.random() * 5;
      ctx.fillStyle = `rgba(${baseR * 0.4},${baseG * 0.4},${baseB * 0.4},0.25)`;
      ctx.beginPath();
      ctx.arc(nx, ny, nr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 5; i++) {
    const bx = Math.random() * size;
    const by = Math.random() * size;
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(bx, by, 3 + Math.random() * 6, 2 + Math.random() * 4);
  }

  noise2d(ctx, size, size, 8);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function createGoldBrickNormal(): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = createCanvas(size, size);

  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, size, size);

  const brickW = size / 4;
  const brickH = size / 6;
  const gap = 3;

  for (let row = 0; row < 7; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let col = -1; col < 5; col++) {
      const x = col * brickW + offset;
      const y = row * brickH;

      ctx.fillStyle = '#9090ff';
      ctx.fillRect(x + gap, y + gap, brickW - gap * 2, brickH - gap * 2);

      ctx.fillStyle = '#7070ee';
      ctx.fillRect(x + gap, y + brickH - gap - 3, brickW - gap * 2, 3);
      ctx.fillRect(x + brickW - gap - 3, y + gap, 3, brickH - gap * 2);

      ctx.fillStyle = '#a0a0ff';
      ctx.fillRect(x + gap, y + gap, brickW - gap * 2, 2);
      ctx.fillRect(x + gap, y + gap, 2, brickH - gap * 2);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function createBarkTexture(): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = createCanvas(size, size);

  ctx.fillStyle = '#4a3520';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 4) {
    const baseR = 80 + Math.random() * 40;
    const baseG = 55 + Math.random() * 30;
    const baseB = 28 + Math.random() * 18;
    ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
    ctx.fillRect(0, y, size, 4 + Math.random() * 3);

    if (Math.random() > 0.25) {
      const crackX = Math.random() * size;
      const crackW = 1 + Math.random() * 3;
      ctx.fillStyle = `rgba(${baseR * 0.25},${baseG * 0.25},${baseB * 0.25},0.8)`;
      ctx.fillRect(crackX, y, crackW, 8 + Math.random() * 30);
    }

    if (Math.random() > 0.5) {
      const hlX = Math.random() * size;
      const hlW = 5 + Math.random() * 20;
      ctx.fillStyle = `rgba(${Math.min(255, baseR + 40)},${Math.min(255, baseG + 35)},${Math.min(255, baseB + 20)},0.35)`;
      ctx.fillRect(hlX, y, hlW, 2 + Math.random() * 2);
    }
  }

  for (let i = 0; i < 25; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 12 + Math.random() * 40;
    const h = 1 + Math.random() * 3;
    ctx.fillStyle = `rgba(30,18,8,${0.4 + Math.random() * 0.3})`;
    ctx.fillRect(x, y, w, h);
  }

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 5 + Math.random() * 22;
    const green = 55 + Math.random() * 85;
    const alpha = 0.12 + Math.random() * 0.35;
    ctx.fillStyle = `rgba(${green * 0.3},${green},${green * 0.2},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 7;
    const g = 70 + Math.random() * 70;
    ctx.fillStyle = `rgba(${g * 0.3},${g},${g * 0.2},${0.2 + Math.random() * 0.35})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.strokeStyle = `rgba(40,70,30,${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 0.8 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let cx = x, cy = y;
    for (let j = 0; j < 5; j++) {
      cx += (Math.random() - 0.5) * 18;
      cy += (Math.random() - 0.5) * 14;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  noise2d(ctx, size, size, 10);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  tex.needsUpdate = true;
  return tex;
}

export function createLeafTexture(): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = createCanvas(size, size);

  const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  bgGrad.addColorStop(0, '#2a5a28');
  bgGrad.addColorStop(1, '#1a3a18');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const leafW = 6 + Math.random() * 16;
    const leafH = 3 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    const green = 40 + Math.random() * 100;
    const brightness = Math.random();
    const r = green * 0.25 + brightness * 20;
    const g = green + brightness * 30;
    const b = green * 0.15 + brightness * 10;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, leafW, leafH, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(${r * 0.4},${g * 0.4},${b * 0.4},0.5)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-leafW * 0.8, 0);
    ctx.lineTo(leafW * 0.8, 0);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < 250; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 7;
    const green = 45 + Math.random() * 90;
    ctx.fillStyle = `rgba(${green * 0.3},${green},${green * 0.15},${0.35 + Math.random() * 0.45})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 4;
    ctx.fillStyle = `rgba(${100 + Math.random() * 50},${140 + Math.random() * 80},${40 + Math.random() * 40},${0.25 + Math.random() * 0.35})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  noise2d(ctx, size, size, 8);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.needsUpdate = true;
  return tex;
}

export function createRockTexture(): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = createCanvas(size, size);

  const baseGrad = ctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#3a3a2a');
  baseGrad.addColorStop(0.5, '#444434');
  baseGrad.addColorStop(1, '#35352a');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 4) {
    const baseR = 50 + Math.random() * 25;
    const baseG = 45 + Math.random() * 20;
    const baseB = 30 + Math.random() * 15;
    ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
    ctx.fillRect(0, y, size, 4 + Math.random() * 3);
  }

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 10 + Math.random() * 40;
    const h = 1 + Math.random() * 4;
    ctx.fillStyle = `rgba(25,22,15,${0.3 + Math.random() * 0.3})`;
    ctx.fillRect(x, y, w, h);
  }

  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 3 + Math.random() * 16;
    const green = 30 + Math.random() * 55;
    const alpha = 0.06 + Math.random() * 0.2;
    ctx.fillStyle = `rgba(${green * 0.3},${green},${green * 0.2},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 5;
    const g = 35 + Math.random() * 45;
    ctx.fillStyle = `rgba(${g * 0.25},${g},${g * 0.15},${0.15 + Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  noise2d(ctx, size, size, 10);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

export function createRockNormal(): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = createCanvas(size, size);

  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 6) {
    ctx.fillStyle = `rgb(${128 + Math.random() * 20 - 10},${128 + Math.random() * 15 - 7},255)`;
    ctx.fillRect(0, y, size, 6);
  }

  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 5 + Math.random() * 20;
    ctx.fillStyle = `rgba(${140 + Math.random() * 20},${130 + Math.random() * 20},255,${0.2 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

export function createStoneMossNormal(): THREE.CanvasTexture {
  const size = 512;
  const [c, ctx] = createCanvas(size, size);

  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, size, size);

  const stones: { x: number; y: number; w: number; h: number }[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sx = col * (size / 8) + (Math.random() - 0.5) * 12;
      const sy = row * (size / 8) + (Math.random() - 0.5) * 12;
      const sw = size / 8 + (Math.random() - 0.5) * 14;
      const sh = size / 8 + (Math.random() - 0.5) * 14;
      stones.push({ x: sx, y: sy, w: sw, h: sh });
    }
  }

  for (const s of stones) {
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const pts = 7 + Math.floor(Math.random() * 3);
    ctx.fillStyle = '#8888ff';
    ctx.beginPath();
    for (let p = 0; p < pts; p++) {
      const angle = (p / pts) * Math.PI * 2;
      const rx = s.w / 2 * (0.8 + Math.random() * 0.4);
      const ry = s.h / 2 * (0.8 + Math.random() * 0.4);
      const px = cx + Math.cos(angle) * rx;
      const py = cy + Math.sin(angle) * ry;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#6060dd';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#a0a0ff';
    ctx.fillRect(s.x + 2, s.y + 2, s.w - 4, 2);
    ctx.fillRect(s.x + 2, s.y + 2, 2, s.h - 4);

    ctx.fillStyle = '#5858cc';
    ctx.fillRect(s.x + 2, s.y + s.h - 4, s.w - 4, 2);
    ctx.fillRect(s.x + s.w - 4, s.y + 2, 2, s.h - 4);
  }

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 5 + Math.random() * 15;
    ctx.fillStyle = `rgba(100,100,255,${0.1 + Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}
