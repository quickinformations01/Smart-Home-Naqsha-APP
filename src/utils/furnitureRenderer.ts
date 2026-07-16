import { FurnitureItem } from '../types';

export function drawFurnitureItem(
  ctx: CanvasRenderingContext2D,
  item: FurnitureItem,
  rx: number,
  ry: number,
  projectFurniturePt: (
    rx: number,
    ry: number,
    itemX: number,
    itemY: number,
    localX: number,
    localY: number,
    localZ: number,
    itemW: number,
    itemL: number,
    itemRotation: number
  ) => { x: number; y: number; depth: number },
  zoom3d: number
) {
  const type = item.type;

  if (type === 'bed') {
    // 1. Headboard
    const h1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0.1, 0, item.width, item.length, item.rotation);
    const h2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0.1, 0, item.width, item.length, item.rotation);
    const hTop1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0.1, 1.4, item.width, item.length, item.rotation);
    const hTop2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0.1, 1.4, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(h1.x, h1.y);
    ctx.lineTo(h2.x, h2.y);
    ctx.lineTo(hTop2.x, hTop2.y);
    ctx.lineTo(hTop1.x, hTop1.y);
    ctx.closePath();
    ctx.fillStyle = '#451a03'; // deep mahogany headboard
    ctx.fill();
    ctx.strokeStyle = '#1e0c02';
    ctx.stroke();

    // 2. Main Bed Frame & Mattress
    const corners = [
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0.1, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0.1, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0.1, 0.8, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0.1, 0.8, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0.8, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0.8, item.width, item.length, item.rotation),
    ];

    // Mattress top surface
    ctx.beginPath();
    ctx.moveTo(corners[4].x, corners[4].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.closePath();
    ctx.fillStyle = '#f8fafc'; // clean white sheet
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    // Mattress sides
    ctx.beginPath();
    ctx.moveTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.closePath();
    ctx.fillStyle = '#78350f';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.lineTo(corners[4].x, corners[4].y);
    ctx.closePath();
    ctx.fillStyle = '#78350f';
    ctx.fill();
    ctx.stroke();

    // 3. Duvet/Blanket Overlay
    const blStart = item.length * 0.45;
    const bl1 = projectFurniturePt(rx, ry, item.x, item.y, 0.05, blStart, 0.81, item.width, item.length, item.rotation);
    const bl2 = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.05, blStart, 0.81, item.width, item.length, item.rotation);
    const bl3 = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.05, item.length - 0.05, 0.81, item.width, item.length, item.rotation);
    const bl4 = projectFurniturePt(rx, ry, item.x, item.y, 0.05, item.length - 0.05, 0.81, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(bl1.x, bl1.y);
    ctx.lineTo(bl2.x, bl2.y);
    ctx.lineTo(bl3.x, bl3.y);
    ctx.lineTo(bl4.x, bl4.y);
    ctx.closePath();
    ctx.fillStyle = '#3b82f6'; // modern blue blanket
    ctx.fill();
    ctx.strokeStyle = '#1d4ed8';
    ctx.stroke();

    // 4. Two Pillows
    const p1_c1 = projectFurniturePt(rx, ry, item.x, item.y, 0.3, 0.4, 0.82, item.width, item.length, item.rotation);
    const p1_c2 = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2 - 0.2, 0.4, 0.82, item.width, item.length, item.rotation);
    const p1_c3 = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2 - 0.2, 1.4, 0.82, item.width, item.length, item.rotation);
    const p1_c4 = projectFurniturePt(rx, ry, item.x, item.y, 0.3, 1.4, 0.82, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(p1_c1.x, p1_c1.y);
    ctx.lineTo(p1_c2.x, p1_c2.y);
    ctx.lineTo(p1_c3.x, p1_c3.y);
    ctx.lineTo(p1_c4.x, p1_c4.y);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    const p2_c1 = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2 + 0.2, 0.4, 0.82, item.width, item.length, item.rotation);
    const p2_c2 = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.3, 0.4, 0.82, item.width, item.length, item.rotation);
    const p2_c3 = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.3, 1.4, 0.82, item.width, item.length, item.rotation);
    const p2_c4 = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2 + 0.2, 1.4, 0.82, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(p2_c1.x, p2_c1.y);
    ctx.lineTo(p2_c2.x, p2_c2.y);
    ctx.lineTo(p2_c3.x, p2_c3.y);
    ctx.lineTo(p2_c4.x, p2_c4.y);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();

  } else if (type === 'nightstand') {
    const corners = [
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, item.height, item.width, item.length, item.rotation),
    ];

    ctx.beginPath();
    ctx.moveTo(corners[4].x, corners[4].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.closePath();
    ctx.fillStyle = '#311001'; // dark timber
    ctx.fill();
    ctx.strokeStyle = '#1e0c02';
    ctx.stroke();

    // Drawer handle/knob
    const knob = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2, item.length, item.height / 2, item.width, item.length, item.rotation);
    ctx.beginPath();
    ctx.arc(knob.x, knob.y, 2.5 * zoom3d, 0, 2 * Math.PI);
    ctx.fillStyle = '#fbbf24'; // brass knob
    ctx.fill();

  } else if (type === 'wardrobe') {
    const corners = [
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, item.height, item.width, item.length, item.rotation),
    ];

    // Top
    ctx.beginPath();
    ctx.moveTo(corners[4].x, corners[4].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.closePath();
    ctx.fillStyle = '#451a03';
    ctx.fill();
    ctx.strokeStyle = '#1e0c02';
    ctx.stroke();

    // Sides
    ctx.beginPath();
    ctx.moveTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.closePath();
    ctx.fillStyle = '#311001';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.lineTo(corners[4].x, corners[4].y);
    ctx.closePath();
    ctx.fillStyle = '#311001';
    ctx.fill();
    ctx.stroke();

    // Inset full-length mirror pane on door
    const mir1 = projectFurniturePt(rx, ry, item.x, item.y, item.width * 0.35, item.length, item.height * 0.15, item.width, item.length, item.rotation);
    const mir2 = projectFurniturePt(rx, ry, item.x, item.y, item.width * 0.65, item.length, item.height * 0.15, item.width, item.length, item.rotation);
    const mir3 = projectFurniturePt(rx, ry, item.x, item.y, item.width * 0.65, item.length, item.height * 0.85, item.width, item.length, item.rotation);
    const mir4 = projectFurniturePt(rx, ry, item.x, item.y, item.width * 0.35, item.length, item.height * 0.85, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(mir1.x, mir1.y);
    ctx.lineTo(mir2.x, mir2.y);
    ctx.lineTo(mir3.x, mir3.y);
    ctx.lineTo(mir4.x, mir4.y);
    ctx.closePath();
    ctx.fillStyle = '#bae6fd'; // reflection glass
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.stroke();

  } else if (type === 'sofa') {
    const corners = [
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, item.height, item.width, item.length, item.rotation),
    ];

    // Main base cushions
    ctx.beginPath();
    ctx.moveTo(corners[4].x, corners[4].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.closePath();
    ctx.fillStyle = '#0f766e'; // teal green upholstery
    ctx.fill();
    ctx.strokeStyle = '#115e59';
    ctx.stroke();

    // Sofa Backrest
    const brTop1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 1.1, item.width, item.length, item.rotation);
    const brTop2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 1.1, item.width, item.length, item.rotation);
    const brTop3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0.4, 1.1, item.width, item.length, item.rotation);
    const brTop4 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0.4, 1.1, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(brTop1.x, brTop1.y);
    ctx.lineTo(brTop2.x, brTop2.y);
    ctx.lineTo(brTop3.x, brTop3.y);
    ctx.lineTo(brTop4.x, brTop4.y);
    ctx.closePath();
    ctx.fillStyle = '#115e59';
    ctx.fill();
    ctx.stroke();

    // Armrests
    const laTop1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0.75, item.width, item.length, item.rotation);
    const laTop2 = projectFurniturePt(rx, ry, item.x, item.y, 0.4, 0, 0.75, item.width, item.length, item.rotation);
    const laTop3 = projectFurniturePt(rx, ry, item.x, item.y, 0.4, item.length, 0.75, item.width, item.length, item.rotation);
    const laTop4 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0.75, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(laTop1.x, laTop1.y);
    ctx.lineTo(laTop2.x, laTop2.y);
    ctx.lineTo(laTop3.x, laTop3.y);
    ctx.lineTo(laTop4.x, laTop4.y);
    ctx.closePath();
    ctx.fillStyle = '#0f766e';
    ctx.fill();
    ctx.stroke();

    const raTop1 = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.4, 0, 0.75, item.width, item.length, item.rotation);
    const raTop2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0.75, item.width, item.length, item.rotation);
    const raTop3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0.75, item.width, item.length, item.rotation);
    const raTop4 = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.4, item.length, 0.75, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(raTop1.x, raTop1.y);
    ctx.lineTo(raTop2.x, raTop2.y);
    ctx.lineTo(raTop3.x, raTop3.y);
    ctx.lineTo(raTop4.x, raTop4.y);
    ctx.closePath();
    ctx.fillStyle = '#0f766e';
    ctx.fill();
    ctx.stroke();

  } else if (type === 'coffee_table') {
    const t1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, item.height, item.width, item.length, item.rotation);
    const t2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, item.height, item.width, item.length, item.rotation);
    const t3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, item.height, item.width, item.length, item.rotation);
    const t4 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, item.height, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(t1.x, t1.y);
    ctx.lineTo(t2.x, t2.y);
    ctx.lineTo(t3.x, t3.y);
    ctx.lineTo(t4.x, t4.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(186, 230, 253, 0.6)'; // sky blue transparent glass
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const legs = [
      projectFurniturePt(rx, ry, item.x, item.y, 0.15, 0.15, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.15, 0.15, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.15, item.length - 0.15, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0.15, item.length - 0.15, 0, item.width, item.length, item.rotation)
    ];
    legs.forEach((leg, idx) => {
      const legTop = projectFurniturePt(rx, ry, item.x, item.y, idx === 0 || idx === 3 ? 0.15 : item.width - 0.15, idx === 0 || idx === 1 ? 0.15 : item.length - 0.15, item.height, item.width, item.length, item.rotation);
      ctx.beginPath();
      ctx.moveTo(leg.x, leg.y);
      ctx.lineTo(legTop.x, legTop.y);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2 * zoom3d;
      ctx.stroke();
    });

  } else if (type === 'tv_set') {
    const cabW = item.width;
    const cabL = 0.8;
    const cabH = 0.5;

    const cTop1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, cabH, item.width, item.length, item.rotation);
    const cTop2 = projectFurniturePt(rx, ry, item.x, item.y, cabW, 0, cabH, item.width, item.length, item.rotation);
    const cTop3 = projectFurniturePt(rx, ry, item.x, item.y, cabW, cabL, cabH, item.width, item.length, item.rotation);
    const cTop4 = projectFurniturePt(rx, ry, item.x, item.y, 0, cabL, cabH, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(cTop1.x, cTop1.y);
    ctx.lineTo(cTop2.x, cTop2.y);
    ctx.lineTo(cTop3.x, cTop3.y);
    ctx.lineTo(cTop4.x, cTop4.y);
    ctx.closePath();
    ctx.fillStyle = '#1e293b'; // slate dark wood
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    const c3 = projectFurniturePt(rx, ry, item.x, item.y, cabW, cabL, 0, item.width, item.length, item.rotation);
    const c4 = projectFurniturePt(rx, ry, item.x, item.y, 0, cabL, 0, item.width, item.length, item.rotation);
    ctx.beginPath();
    ctx.moveTo(c4.x, c4.y);
    ctx.lineTo(c3.x, c3.y);
    ctx.lineTo(cTop3.x, cTop3.y);
    ctx.lineTo(cTop4.x, cTop4.y);
    ctx.closePath();
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.stroke();

    const tvL1 = projectFurniturePt(rx, ry, item.x, item.y, 0.6, cabL / 2, cabH, item.width, item.length, item.rotation);
    const tvL2 = projectFurniturePt(rx, ry, item.x, item.y, cabW - 0.6, cabL / 2, cabH, item.width, item.length, item.rotation);
    const tvT1 = projectFurniturePt(rx, ry, item.x, item.y, 0.6, cabL / 2, cabH + 1.2, item.width, item.length, item.rotation);
    const tvT2 = projectFurniturePt(rx, ry, item.x, item.y, cabW - 0.6, cabL / 2, cabH + 1.2, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(tvL1.x, tvL1.y);
    ctx.lineTo(tvL2.x, tvL2.y);
    ctx.lineTo(tvT2.x, tvT2.y);
    ctx.lineTo(tvT1.x, tvT1.y);
    ctx.closePath();
    ctx.fillStyle = '#020617'; // glossy black screen
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else if (type === 'dining_table') {
    const t1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, item.height, item.width, item.length, item.rotation);
    const t2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, item.height, item.width, item.length, item.rotation);
    const t3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, item.height, item.width, item.length, item.rotation);
    const t4 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, item.height, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(t1.x, t1.y);
    ctx.lineTo(t2.x, t2.y);
    ctx.lineTo(t3.x, t3.y);
    ctx.lineTo(t4.x, t4.y);
    ctx.closePath();
    ctx.fillStyle = '#b45309'; // warm cherry wood table top
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.stroke();

    const legs = [
      projectFurniturePt(rx, ry, item.x, item.y, 0.15, 0.15, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.15, 0.15, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.15, item.length - 0.15, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0.15, item.length - 0.15, 0, item.width, item.length, item.rotation)
    ];
    legs.forEach((leg, idx) => {
      const legTop = projectFurniturePt(rx, ry, item.x, item.y, idx === 0 || idx === 3 ? 0.15 : item.width - 0.15, idx === 0 || idx === 1 ? 0.15 : item.length - 0.15, item.height, item.width, item.length, item.rotation);
      ctx.beginPath();
      ctx.moveTo(leg.x, leg.y);
      ctx.lineTo(legTop.x, legTop.y);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3.5 * zoom3d;
      ctx.stroke();
    });

  } else if (type === 'dining_chair') {
    const seat1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0.45, item.width, item.length, item.rotation);
    const seat2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0.45, item.width, item.length, item.rotation);
    const seat3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0.45, item.width, item.length, item.rotation);
    const seat4 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0.45, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(seat1.x, seat1.y);
    ctx.lineTo(seat2.x, seat2.y);
    ctx.lineTo(seat3.x, seat3.y);
    ctx.lineTo(seat4.x, seat4.y);
    ctx.closePath();
    ctx.fillStyle = '#334155'; // dark cushions
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    const br1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0.1, 0.45, item.width, item.length, item.rotation);
    const br2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0.1, 0.45, item.width, item.length, item.rotation);
    const brTop1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0.1, 1.0, item.width, item.length, item.rotation);
    const brTop2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0.1, 1.0, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(br1.x, br1.y);
    ctx.lineTo(br2.x, br2.y);
    ctx.lineTo(brTop2.x, brTop2.y);
    ctx.lineTo(brTop1.x, brTop1.y);
    ctx.closePath();
    ctx.fillStyle = '#475569';
    ctx.fill();
    ctx.stroke();

  } else if (type === 'kitchen_counter') {
    const corners = [
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, item.height, item.width, item.length, item.rotation),
    ];

    ctx.beginPath();
    ctx.moveTo(corners[4].x, corners[4].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.closePath();
    ctx.fillStyle = '#0f172a'; // black granite
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(corners[3].x, corners[3].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.closePath();
    ctx.fillStyle = '#475569';
    ctx.fill();
    ctx.stroke();

  } else if (type === 'stove') {
    const plt1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0, item.width, item.length, item.rotation);
    const plt2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0, item.width, item.length, item.rotation);
    const plt3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0, item.width, item.length, item.rotation);
    const plt4 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(plt1.x, plt1.y);
    ctx.lineTo(plt2.x, plt2.y);
    ctx.lineTo(plt3.x, plt3.y);
    ctx.lineTo(plt4.x, plt4.y);
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.stroke();

    const b1 = projectFurniturePt(rx, ry, item.x, item.y, item.width * 0.3, item.length * 0.5, 0.01, item.width, item.length, item.rotation);
    const b2 = projectFurniturePt(rx, ry, item.x, item.y, item.width * 0.7, item.length * 0.5, 0.01, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.arc(b1.x, b1.y, 4 * zoom3d, 0, 2 * Math.PI);
    ctx.fillStyle = '#f97316'; // induction coils
    ctx.fill();

    ctx.beginPath();
    ctx.arc(b2.x, b2.y, 4 * zoom3d, 0, 2 * Math.PI);
    ctx.fillStyle = '#f97316';
    ctx.fill();

  } else if (type === 'sink') {
    const sFrame1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0, item.width, item.length, item.rotation);
    const sFrame2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0, item.width, item.length, item.rotation);
    const sFrame3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0, item.width, item.length, item.rotation);
    const sFrame4 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(sFrame1.x, sFrame1.y);
    ctx.lineTo(sFrame2.x, sFrame2.y);
    ctx.lineTo(sFrame3.x, sFrame3.y);
    ctx.lineTo(sFrame4.x, sFrame4.y);
    ctx.closePath();
    ctx.fillStyle = '#475569';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.stroke();

    const bowl1 = projectFurniturePt(rx, ry, item.x, item.y, 0.15, 0.15, 0.01, item.width, item.length, item.rotation);
    const bowl2 = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.15, 0.15, 0.01, item.width, item.length, item.rotation);
    const bowl3 = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.15, item.length - 0.15, 0.01, item.width, item.length, item.rotation);
    const bowl4 = projectFurniturePt(rx, ry, item.x, item.y, 0.15, item.length - 0.15, 0.01, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(bowl1.x, bowl1.y);
    ctx.lineTo(bowl2.x, bowl2.y);
    ctx.lineTo(bowl3.x, bowl3.y);
    ctx.lineTo(bowl4.x, bowl4.y);
    ctx.closePath();
    ctx.fillStyle = '#bae6fd'; // water shine
    ctx.fill();
    ctx.stroke();

    const faucetB = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2, 0.1, 0, item.width, item.length, item.rotation);
    const faucetT = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2, 0.15, 0.4, item.width, item.length, item.rotation);
    ctx.beginPath();
    ctx.moveTo(faucetB.x, faucetB.y);
    ctx.lineTo(faucetT.x, faucetT.y);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.stroke();

  } else if (type === 'fridge') {
    const corners = [
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, item.height, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, item.height, item.width, item.length, item.rotation),
    ];

    ctx.beginPath();
    ctx.moveTo(corners[4].x, corners[4].y);
    ctx.lineTo(corners[5].x, corners[5].y);
    ctx.lineTo(corners[6].x, corners[6].y);
    ctx.lineTo(corners[7].x, corners[7].y);
    ctx.closePath();
    ctx.fillStyle = '#cbd5e1'; // steel fridge
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.stroke();

    const dLine = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2, item.length, item.height, item.width, item.length, item.rotation);
    const dLineB = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2, item.length, 0, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(dLineB.x, dLineB.y);
    ctx.lineTo(dLine.x, dLine.y);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    const hdl1 = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2 - 0.25, item.length, item.height * 0.4, item.width, item.length, item.rotation);
    const hdl2 = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2 - 0.25, item.length, item.height * 0.7, item.width, item.length, item.rotation);
    ctx.beginPath();
    ctx.moveTo(hdl1.x, hdl1.y);
    ctx.lineTo(hdl2.x, hdl2.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.stroke();

  } else if (type === 'car') {
    const whs = [
      projectFurniturePt(rx, ry, item.x, item.y, 0.3, item.length * 0.2, 0.22, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.3, item.length * 0.2, 0.22, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0.3, item.length * 0.8, 0.22, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.3, item.length * 0.8, 0.22, item.width, item.length, item.rotation),
    ];
    whs.forEach((w) => {
      ctx.beginPath();
      ctx.arc(w.x, w.y, 6.5 * zoom3d, 0, 2 * Math.PI);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(w.x, w.y, 3 * zoom3d, 0, 2 * Math.PI);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
    });

    const body = [
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0.2, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0.2, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0.2, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0.2, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 1.05, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 1.05, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 1.05, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 1.05, item.width, item.length, item.rotation),
    ];

    ctx.beginPath();
    ctx.moveTo(body[4].x, body[4].y);
    ctx.lineTo(body[5].x, body[5].y);
    ctx.lineTo(body[6].x, body[6].y);
    ctx.lineTo(body[7].x, body[7].y);
    ctx.closePath();
    ctx.fillStyle = '#ef4444'; // sporty red
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(body[0].x, body[0].y);
    ctx.lineTo(body[3].x, body[3].y);
    ctx.lineTo(body[7].x, body[7].y);
    ctx.lineTo(body[4].x, body[4].y);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(body[1].x, body[1].y);
    ctx.lineTo(body[2].x, body[2].y);
    ctx.lineTo(body[6].x, body[6].y);
    ctx.lineTo(body[5].x, body[5].y);
    ctx.closePath();
    ctx.fillStyle = '#b91c1c';
    ctx.fill();
    ctx.stroke();

    const hl1_l = projectFurniturePt(rx, ry, item.x, item.y, 0.3, 0, 0.6, item.width, item.length, item.rotation);
    const hl1_r = projectFurniturePt(rx, ry, item.x, item.y, 1.2, 0, 0.6, item.width, item.length, item.rotation);
    const hl1_t = projectFurniturePt(rx, ry, item.x, item.y, 0.8, 0, 0.9, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(hl1_l.x, hl1_l.y);
    ctx.lineTo(hl1_r.x, hl1_r.y);
    ctx.lineTo(hl1_t.x, hl1_t.y);
    ctx.closePath();
    ctx.fillStyle = '#fef08a';
    ctx.fill();

    const hl2_l = projectFurniturePt(rx, ry, item.x, item.y, item.width - 1.2, 0, 0.6, item.width, item.length, item.rotation);
    const hl2_r = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.3, 0, 0.6, item.width, item.length, item.rotation);
    const hl2_t = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.8, 0, 0.9, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(hl2_l.x, hl2_l.y);
    ctx.lineTo(hl2_r.x, hl2_r.y);
    ctx.lineTo(hl2_t.x, hl2_t.y);
    ctx.closePath();
    ctx.fillStyle = '#fef08a';
    ctx.fill();

    const cabin = [
      projectFurniturePt(rx, ry, item.x, item.y, 0.4, item.length * 0.4, 1.05, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.4, item.length * 0.4, 1.05, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.4, item.length * 0.7, 1.05, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0.4, item.length * 0.7, 1.05, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0.5, item.length * 0.42, 1.55, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.5, item.length * 0.42, 1.55, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.5, item.length * 0.68, 1.55, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, 0.5, item.length * 0.68, 1.55, item.width, item.length, item.rotation),
    ];

    ctx.beginPath();
    ctx.moveTo(cabin[4].x, cabin[4].y);
    ctx.lineTo(cabin[5].x, cabin[5].y);
    ctx.lineTo(cabin[6].x, cabin[6].y);
    ctx.lineTo(cabin[7].x, cabin[7].y);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cabin[0].x, cabin[0].y);
    ctx.lineTo(cabin[1].x, cabin[1].y);
    ctx.lineTo(cabin[5].x, cabin[5].y);
    ctx.lineTo(cabin[4].x, cabin[4].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
    ctx.fill();
    ctx.stroke();

  } else if (type === 'stairs') {
    const stepsCount = 8;
    const stepH = item.height / stepsCount;
    const stepW = item.width;
    const stepL = item.length / stepsCount;

    for (let i = 0; i < stepsCount; i++) {
      const sy_step = i * stepL;
      const sz_step = i * stepH;

      const stepCorners = [
        projectFurniturePt(rx, ry, item.x, item.y, 0, sy_step, sz_step, item.width, item.length, item.rotation),
        projectFurniturePt(rx, ry, item.x, item.y, stepW, sy_step, sz_step, item.width, item.length, item.rotation),
        projectFurniturePt(rx, ry, item.x, item.y, stepW, sy_step + stepL, sz_step, item.width, item.length, item.rotation),
        projectFurniturePt(rx, ry, item.x, item.y, 0, sy_step + stepL, sz_step, item.width, item.length, item.rotation),
        projectFurniturePt(rx, ry, item.x, item.y, 0, sy_step, sz_step + stepH, item.width, item.length, item.rotation),
        projectFurniturePt(rx, ry, item.x, item.y, stepW, sy_step, sz_step + stepH, item.width, item.length, item.rotation),
        projectFurniturePt(rx, ry, item.x, item.y, stepW, sy_step + stepL, sz_step + stepH, item.width, item.length, item.rotation),
        projectFurniturePt(rx, ry, item.x, item.y, 0, sy_step + stepL, sz_step + stepH, item.width, item.length, item.rotation),
      ];

      ctx.beginPath();
      ctx.moveTo(stepCorners[4].x, stepCorners[4].y);
      ctx.lineTo(stepCorners[5].x, stepCorners[5].y);
      ctx.lineTo(stepCorners[6].x, stepCorners[6].y);
      ctx.lineTo(stepCorners[7].x, stepCorners[7].y);
      ctx.closePath();
      ctx.fillStyle = '#e879f9'; // violet stairs
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(stepCorners[3].x, stepCorners[3].y);
      ctx.lineTo(stepCorners[2].x, stepCorners[2].y);
      ctx.lineTo(stepCorners[6].x, stepCorners[6].y);
      ctx.lineTo(stepCorners[7].x, stepCorners[7].y);
      ctx.closePath();
      ctx.fillStyle = '#a21caf';
      ctx.fill();
      ctx.stroke();
    }

  } else if (type === 'toilet') {
    const seat = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2, item.length * 0.4, 0.45, item.width, item.length, item.rotation);
    ctx.beginPath();
    ctx.arc(seat.x, seat.y, 4.5 * zoom3d, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    const tnkTop1 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length * 0.7, 1.1, item.width, item.length, item.rotation);
    const tnkTop2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length * 0.7, 1.1, item.width, item.length, item.rotation);
    const tnkTop3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 1.1, item.width, item.length, item.rotation);
    const tnkTop4 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 1.1, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(tnkTop1.x, tnkTop1.y);
    ctx.lineTo(tnkTop2.x, tnkTop2.y);
    ctx.lineTo(tnkTop3.x, tnkTop3.y);
    ctx.lineTo(tnkTop4.x, tnkTop4.y);
    ctx.closePath();
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.stroke();

  } else if (type === 'bathtub') {
    const tubTop1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, item.height, item.width, item.length, item.rotation);
    const tubTop2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, item.height, item.width, item.length, item.rotation);
    const tubTop3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, item.height, item.width, item.length, item.rotation);
    const tubTop4 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, item.height, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(tubTop1.x, tubTop1.y);
    ctx.lineTo(tubTop2.x, tubTop2.y);
    ctx.lineTo(tubTop3.x, tubTop3.y);
    ctx.lineTo(tubTop4.x, tubTop4.y);
    ctx.closePath();
    ctx.fillStyle = '#f8fafc'; // porcelain white
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    const well1 = projectFurniturePt(rx, ry, item.x, item.y, 0.15, 0.15, item.height - 0.05, item.width, item.length, item.rotation);
    const well2 = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.15, 0.15, item.height - 0.05, item.width, item.length, item.rotation);
    const well3 = projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.15, item.length - 0.15, item.height - 0.05, item.width, item.length, item.rotation);
    const well4 = projectFurniturePt(rx, ry, item.x, item.y, 0.15, item.length - 0.15, item.height - 0.05, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(well1.x, well1.y);
    ctx.lineTo(well2.x, well2.y);
    ctx.lineTo(well3.x, well3.y);
    ctx.lineTo(well4.x, well4.y);
    ctx.closePath();
    ctx.fillStyle = '#bae6fd'; // bubbles
    ctx.fill();
    ctx.stroke();

  } else if (type === 'bench') {
    const b1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, item.height, item.width, item.length, item.rotation);
    const b2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, item.height, item.width, item.length, item.rotation);
    const b3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, item.height, item.width, item.length, item.rotation);
    const b4 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, item.height, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(b1.x, b1.y);
    ctx.lineTo(b2.x, b2.y);
    ctx.lineTo(b3.x, b3.y);
    ctx.lineTo(b4.x, b4.y);
    ctx.closePath();
    ctx.fillStyle = '#d97706'; // garden timber
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.stroke();

    const legs = [
      projectFurniturePt(rx, ry, item.x, item.y, 0.3, 0.3, 0, item.width, item.length, item.rotation),
      projectFurniturePt(rx, ry, item.x, item.y, item.width - 0.3, item.length - 0.3, 0, item.width, item.length, item.rotation)
    ];
    legs.forEach((leg, idx) => {
      const legTop = projectFurniturePt(rx, ry, item.x, item.y, idx === 0 ? 0.3 : item.width - 0.3, idx === 0 ? 0.3 : item.length - 0.3, item.height, item.width, item.length, item.rotation);
      ctx.beginPath();
      ctx.moveTo(leg.x, leg.y);
      ctx.lineTo(legTop.x, legTop.y);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

  } else if (type === 'plant') {
    const potTop = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2, item.length / 2, 0.5, item.width, item.length, item.rotation);
    const foliage = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2, item.length / 2, 0.9, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.arc(potTop.x, potTop.y, 5 * zoom3d, 0, 2 * Math.PI);
    ctx.fillStyle = '#ea580c'; // terracotta pot
    ctx.fill();

    ctx.beginPath();
    ctx.arc(foliage.x, foliage.y, 11 * zoom3d, 0, 2 * Math.PI);
    ctx.fillStyle = '#16a34a'; // leaves
    ctx.fill();

    const fl1 = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2 - 0.2, item.length / 2 + 0.1, 1.0, item.width, item.length, item.rotation);
    const fl2 = projectFurniturePt(rx, ry, item.x, item.y, item.width / 2 + 0.3, item.length / 2 - 0.2, 1.0, item.width, item.length, item.rotation);
    ctx.beginPath();
    ctx.arc(fl1.x, fl1.y, 2 * zoom3d, 0, 2 * Math.PI);
    ctx.arc(fl2.x, fl2.y, 2 * zoom3d, 0, 2 * Math.PI);
    ctx.fillStyle = '#f43f5e'; // floral buds
    ctx.fill();

  } else if (type === 'rug') {
    const rug1 = projectFurniturePt(rx, ry, item.x, item.y, 0, 0, 0.01, item.width, item.length, item.rotation);
    const rug2 = projectFurniturePt(rx, ry, item.x, item.y, item.width, 0, 0.01, item.width, item.length, item.rotation);
    const rug3 = projectFurniturePt(rx, ry, item.x, item.y, item.width, item.length, 0.01, item.width, item.length, item.rotation);
    const rug4 = projectFurniturePt(rx, ry, item.x, item.y, 0, item.length, 0.01, item.width, item.length, item.rotation);

    ctx.beginPath();
    ctx.moveTo(rug1.x, rug1.y);
    ctx.lineTo(rug2.x, rug2.y);
    ctx.lineTo(rug3.x, rug3.y);
    ctx.lineTo(rug4.x, rug4.y);
    ctx.closePath();
    ctx.fillStyle = '#fef3c7'; // warm yellow
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
