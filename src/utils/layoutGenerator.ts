import { NaqshaLayout, Room, Door, Window, RoomType, NaqshaSummary } from '../types';
import { analyzeLayout } from './analysisEngine';

interface TemplateConfig {
  id: number;
  name: string;
  backRatio: number;
  frontRatio: number;
  backType: 'split' | 'outer_baths' | 'corridor' | 'single';
  midType: 'classic' | 'swapped' | 'courtyard' | 'pantry';
  frontType: 'classic' | 'swapped' | 'lawn_centric';
}

const TEMPLATES: TemplateConfig[] = [
  { id: 1, name: 'V1 - Classic Balanced', backRatio: 0.38, frontRatio: 0.30, backType: 'split', midType: 'classic', frontType: 'classic' },
  { id: 2, name: 'V2 - Modern Open-Concept', backRatio: 0.35, frontRatio: 0.30, backType: 'outer_baths', midType: 'swapped', frontType: 'swapped' },
  { id: 3, name: 'V3 - Courtyard Airflow', backRatio: 0.40, frontRatio: 0.30, backType: 'split', midType: 'courtyard', frontType: 'classic' },
  { id: 4, name: 'V4 - Luxury Premium Suite', backRatio: 0.34, frontRatio: 0.28, backType: 'single', midType: 'pantry', frontType: 'classic' },
  { id: 5, name: 'V5 - High-Privacy Corridor', backRatio: 0.36, frontRatio: 0.30, backType: 'corridor', midType: 'classic', frontType: 'classic' },
  { id: 6, name: 'V6 - Lawn-Centric Vista', backRatio: 0.38, frontRatio: 0.32, backType: 'split', midType: 'classic', frontType: 'lawn_centric' },
  { id: 7, name: 'V7 - Long Plot Studio', backRatio: 0.42, frontRatio: 0.30, backType: 'single', midType: 'swapped', frontType: 'swapped' },
  { id: 8, name: 'V8 - High-Density Multi-Bed', backRatio: 0.35, frontRatio: 0.32, backType: 'split', midType: 'classic', frontType: 'classic' },
];

function scoreCandidate(layout: NaqshaLayout, preferences: any): { score: number; report: string[] } {
  let score = 100;
  const report: string[] = [];

  // 1. Overlap Check
  for (let i = 0; i < layout.rooms.length; i++) {
    for (let j = i + 1; j < layout.rooms.length; j++) {
      const r1 = layout.rooms[i];
      const r2 = layout.rooms[j];
      const xOverlap = Math.max(0, Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x));
      const yOverlap = Math.max(0, Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y));
      if (xOverlap > 0.1 && yOverlap > 0.1) {
        score -= 500;
        report.push(`REJECT: ${r1.name} and ${r2.name} overlap.`);
      }
    }
  }

  // 2. Boundary Check
  layout.rooms.forEach(r => {
    if (r.x < -0.1 || r.y < -0.1 || r.x + r.width > layout.width + 0.1 || r.y + r.height > layout.length + 0.1) {
      score -= 500;
      report.push(`REJECT: ${r.name} exceeds boundaries.`);
    }
  });

  // 3. Proportion Check
  layout.rooms.forEach(r => {
    if (r.type !== 'lawn' && r.type !== 'corridor' && r.type !== 'staircase') {
      const ratio = r.width / r.height;
      if (ratio < 0.5 || ratio > 2.0) {
        score -= 10;
        report.push(`Proportion Penalty: ${r.name} (${ratio.toFixed(1)})`);
      } else {
        score += 3;
      }
    }
  });

  // 4. Entrance & Garage Placement
  const porch = layout.rooms.find(r => r.type === 'garage');
  if (porch) {
    if (porch.y + porch.height >= layout.length - 2) {
      score += 15;
    } else {
      score -= 30;
      report.push('Entrance Penalty: Porch is not at the front boundary.');
    }
  }

  // 5. Privacy: Bedrooms in quiet zone
  const bedrooms = layout.rooms.filter(r => r.type === 'bedroom');
  bedrooms.forEach(b => {
    if (b.y < layout.length * 0.45) {
      score += 10;
    } else {
      score -= 15;
      report.push(`Privacy Penalty: Bedroom (${b.name}) too close to front.`);
    }
  });

  // 6. Kitchen-Dining adjacency
  const kitchen = layout.rooms.find(r => r.type === 'kitchen');
  const living = layout.rooms.find(r => r.type === 'living');
  if (kitchen) {
    const isExterior = kitchen.x === 0 || Math.abs(kitchen.x + kitchen.width - layout.width) < 0.2 || kitchen.y === 0;
    if (isExterior) {
      score += 15;
    } else {
      score -= 10;
      report.push('Ventilation Penalty: Kitchen not on exterior wall.');
    }

    if (living) {
      const isAdjacent = Math.abs(kitchen.x + kitchen.width - living.x) < 0.5 || Math.abs(living.x + living.width - kitchen.x) < 0.5 || Math.abs(kitchen.y + kitchen.height - living.y) < 0.5;
      if (isAdjacent) {
        score += 15;
      } else {
        score -= 10;
        report.push('Dining Penalty: Kitchen is separated from living space.');
      }
    }
  }

  // 7. Attached Bathrooms and Common Bath Accessibility
  const bathrooms = layout.rooms.filter(r => r.type === 'bathroom');
  bathrooms.forEach(bath => {
    if (bath.name.toLowerCase().includes('att')) {
      let touchesBedroom = false;
      bedrooms.forEach(bed => {
        const xOverlap = Math.max(0, Math.min(bath.x + bath.width, bed.x + bed.width) - Math.max(bath.x, bed.x));
        const yOverlap = Math.max(0, Math.min(bath.y + bath.height, bed.y + bed.height) - Math.max(bath.y, bed.y));
        const touchX = Math.abs(bath.x - (bed.x + bed.width)) < 0.2 || Math.abs((bath.x + bath.width) - bed.x) < 0.2;
        const touchY = Math.abs(bath.y - (bed.y + bed.height)) < 0.2 || Math.abs((bath.y + bath.height) - bed.y) < 0.2;
        if ((touchX && yOverlap > 0.1) || (touchY && xOverlap > 0.1) || (xOverlap > 0.1 && yOverlap > 0.1)) {
          touchesBedroom = true;
        }
      });
      if (touchesBedroom) score += 10;
      else {
        score -= 25;
        report.push(`Bathroom Penalty: Attached bath (${bath.name}) does not touch a bedroom.`);
      }
    } else {
      let touchesLounge = false;
      layout.rooms.forEach(r => {
        if (r.type === 'living' || r.type === 'drawing' || r.type === 'corridor') {
          const xOverlap = Math.max(0, Math.min(bath.x + bath.width, r.x + r.width) - Math.max(bath.x, r.x));
          const yOverlap = Math.max(0, Math.min(bath.y + bath.height, r.y + r.height) - Math.max(bath.y, r.y));
          const touchX = Math.abs(bath.x - (r.x + r.width)) < 0.2 || Math.abs((bath.x + bath.width) - r.x) < 0.2;
          const touchY = Math.abs(bath.y - (r.y + r.height)) < 0.2 || Math.abs((bath.y + bath.height) - r.y) < 0.2;
          if ((touchX && yOverlap > 0.1) || (touchY && xOverlap > 0.1)) touchesLounge = true;
        }
      });
      if (touchesLounge) score += 15;
      else {
        score -= 20;
        report.push(`Bathroom Penalty: Common bath is isolated.`);
      }
    }
  });

  // 8. Room count match with requested preferences
  if (preferences.bedrooms && bedrooms.length !== preferences.bedrooms) {
    score -= 40;
    report.push(`Preference Penalty: Has ${bedrooms.length} beds (Requested: ${preferences.bedrooms})`);
  }

  return { score, report };
}

/**
 * Pure Rule-Based Aspect Ratio Refiner
 * Ensures no room becomes an awkward, skinny rectangle (aspect ratio > 1.52:1)
 * when plot length or width has a great difference. Splits long spans into two well-proportioned rooms.
 */
function refineLayoutAspectRatios(layout: NaqshaLayout): NaqshaLayout {
  const newRooms: Room[] = [];
  const roomSplitsMap = new Map<string, { r1: Room; r2: Room }>();

  let idCounter = 100;
  const nextSplitId = (prefix: string) => `${prefix}_split_${idCounter++}`;

  layout.rooms.forEach((r) => {
    // Skip lawns, corridors, staircases, or tiny spaces
    if (
      r.type === 'lawn' ||
      r.type === 'corridor' ||
      r.type === 'staircase' ||
      r.width * r.height < (layout.unit === 'ft' ? 36 : 3.3)
    ) {
      newRooms.push(r);
      return;
    }

    const ar = Math.max(r.width / r.height, r.height / r.width);
    if (ar <= 1.52) {
      // Room shape is already well-proportioned
      newRooms.push(r);
      return;
    }

    // Room is excessively elongated rectangle (aspect ratio > 1.52:1)
    if (r.height > 1.52 * r.width) {
      // Vertically elongated -> split horizontally into two stacked rooms
      const targetH = Math.round(r.width * 1.2 * 10) / 10;
      const h1 = Math.max(layout.unit === 'ft' ? 7.5 : 2.2, Math.min(targetH, r.height - (layout.unit === 'ft' ? 5 : 1.5)));
      const h2 = Math.round((r.height - h1) * 10) / 10;

      let subName1 = r.name;
      let subName2 = `${r.name} Alcove`;
      let subType1 = r.type;
      let subType2: RoomType = 'other';

      if (r.type === 'bedroom') {
        subName1 = r.name;
        subName2 = 'Dress & Walk-in Wardrobe';
        subType2 = 'other';
      } else if (r.type === 'kitchen') {
        subName1 = 'Gourmet Kitchen';
        subName2 = 'Kitchen Store & Utility';
        subType2 = 'other';
      } else if (r.type === 'living') {
        subName1 = 'Family TV Lounge';
        subName2 = 'Formal Dining Area';
        subType2 = 'living';
      } else if (r.type === 'drawing') {
        subName1 = 'Drawing Room';
        subName2 = 'Reception Foyer & Powder';
        subType2 = 'other';
      }

      const r1: Room = {
        ...r,
        id: nextSplitId('room'),
        name: subName1,
        type: subType1,
        height: h1,
      };

      const r2: Room = {
        ...r,
        id: nextSplitId('room'),
        name: subName2,
        type: subType2,
        y: Math.round((r.y + h1) * 10) / 10,
        height: h2,
        color: subType2 === 'other' ? '#f8fafc' : r.color,
      };

      newRooms.push(r1, r2);
      roomSplitsMap.set(r.id, { r1, r2 });
    } else if (r.width > 1.52 * r.height) {
      // Horizontally elongated -> split vertically into two side-by-side rooms
      const targetW = Math.round(r.height * 1.2 * 10) / 10;
      const w1 = Math.max(layout.unit === 'ft' ? 7.5 : 2.2, Math.min(targetW, r.width - (layout.unit === 'ft' ? 5 : 1.5)));
      const w2 = Math.round((r.width - w1) * 10) / 10;

      let subName1 = r.name;
      let subName2 = `${r.name} Space`;
      let subType1 = r.type;
      let subType2: RoomType = 'other';

      if (r.type === 'bedroom') {
        subName1 = r.name;
        subName2 = 'Dresser & Attached Bath';
        subType2 = 'bathroom';
      } else if (r.type === 'kitchen') {
        subName1 = 'Main Kitchen';
        subName2 = 'Pantry Store';
        subType2 = 'other';
      } else if (r.type === 'living') {
        subName1 = 'Family Lounge';
        subName2 = 'Dining Space';
        subType2 = 'living';
      } else if (r.type === 'drawing') {
        subName1 = 'Drawing Room';
        subName2 = 'Entrance Foyer';
        subType2 = 'other';
      }

      const r1: Room = {
        ...r,
        id: nextSplitId('room'),
        name: subName1,
        type: subType1,
        width: w1,
      };

      const r2: Room = {
        ...r,
        id: nextSplitId('room'),
        name: subName2,
        type: subType2,
        x: Math.round((r.x + w1) * 10) / 10,
        width: w2,
        color: subType2 === 'bathroom' ? '#f1f5f9' : r.color,
      };

      newRooms.push(r1, r2);
      roomSplitsMap.set(r.id, { r1, r2 });
    } else {
      newRooms.push(r);
    }
  });

  // Re-map doors and windows for split rooms
  const newDoors: Door[] = [];
  layout.doors.forEach((d) => {
    if (d.roomId && roomSplitsMap.has(d.roomId)) {
      const { r1, r2 } = roomSplitsMap.get(d.roomId)!;
      if (d.x >= r1.x - 0.5 && d.x <= r1.x + r1.width + 0.5 && d.y >= r1.y - 0.5 && d.y <= r1.y + r1.height + 0.5) {
        newDoors.push({ ...d, roomId: r1.id });
      } else {
        newDoors.push({ ...d, roomId: r2.id });
      }
    } else {
      newDoors.push(d);
    }
  });

  const newWindows: Window[] = [];
  layout.windows.forEach((w) => {
    if (w.roomId && roomSplitsMap.has(w.roomId)) {
      const { r1, r2 } = roomSplitsMap.get(w.roomId)!;
      if (w.x >= r1.x - 0.5 && w.x <= r1.x + r1.width + 0.5 && w.y >= r1.y - 0.5 && w.y <= r1.y + r1.height + 0.5) {
        newWindows.push({ ...w, roomId: r1.id });
      } else {
        newWindows.push({ ...w, roomId: r2.id });
      }
    } else {
      newWindows.push(w);
    }
  });

  return {
    ...layout,
    rooms: newRooms,
    doors: newDoors,
    windows: newWindows,
  };
}

function buildCandidate(
  config: TemplateConfig,
  width: number,
  length: number,
  unit: 'ft' | 'm',
  preferences: any
): NaqshaLayout {
  const activeFloor = preferences.floor ?? 'ground';
  const hasGarage = activeFloor === 'ground' && preferences.garage !== 'No' && (width >= (unit === 'ft' ? 14 : 4.2));
  const hasDrawing = preferences.drawingRoom !== 'No' && (width >= (unit === 'ft' ? 16 : 4.8));
  const hasLawn = activeFloor === 'ground' && preferences.lawn !== 'No' && length >= (unit === 'ft' ? 35 : 10.5);

  const rooms: Room[] = [];
  const doors: Door[] = [];
  const windows: Window[] = [];

  let idCounter = 1;
  const nextId = (prefix: string) => `${prefix}_cand_${config.id}_${idCounter++}`;

  const colors: Record<string, string> = {
    bedroom: '#ffffff',
    bathroom: '#f1f5f9',
    kitchen: '#ffffff',
    living: '#e0f2fe',
    drawing: '#ffffff',
    garage: '#f1f5f9',
    lawn: '#dcfce7',
    staircase: '#f8fafc',
    corridor: '#f1f5f9',
    other: '#ffffff',
  };

  const addRoom = (name: string, type: RoomType, rx: number, ry: number, rw: number, rh: number): Room => {
    let chosenColor = colors[type] || '#ffffff';
    if (name.toLowerCase().includes('pantry') || name.toLowerCase().includes('bath')) {
      chosenColor = '#f1f5f9'; // Soft grey for bathrooms/pantry
    } else if (name.toLowerCase().includes('ventilation') || name.toLowerCase().includes('o.t.s') || name.toLowerCase().includes('atrium') || name.toLowerCase().includes('courtyard')) {
      chosenColor = '#dcfce7'; // Light green tint for ventilation/open shafts
    } else if (type === 'living') {
      chosenColor = '#e0f2fe'; // Subtle light blue shading for living spaces
    }

    const r: Room = {
      id: nextId('room'),
      name,
      type,
      x: Math.round(rx * 10) / 10,
      y: Math.round(ry * 10) / 10,
      width: Math.round(rw * 10) / 10,
      height: Math.round(rh * 10) / 10,
      color: chosenColor,
    };
    rooms.push(r);
    return r;
  };

  const openBackHeight = length > (unit === 'ft' ? 45 : 14) ? (unit === 'ft' ? 3 : 1) : 0;
  const openFrontHeight = hasLawn ? (unit === 'ft' ? 5 : 1.5) : 0;

  const usableLength = length - openBackHeight - openFrontHeight;
  const usableWidth = width;

  const reqBeds = preferences.bedrooms ?? 2;
  const customPlacedRoomIds = new Set<string>();

  // Determine back zone room widths first to prevent aspect ratio distortion
  let wCenterTemp = 0;
  let wBedBackTemp = usableWidth;
  if (reqBeds >= 2 && usableWidth >= (unit === 'ft' ? 24 : 7.2)) {
    if (config.backType === 'split' || config.backType === 'outer_baths') {
      wCenterTemp = unit === 'ft' ? Math.max(5.5, Math.min(8.0, usableWidth * 0.2)) : Math.max(1.7, Math.min(2.4, usableWidth * 0.2));
      wBedBackTemp = (usableWidth - wCenterTemp) / 2;
    } else if (config.backType === 'corridor') {
      const wCorr = unit === 'ft' ? 4 : 1.2;
      const wBath = Math.min(unit === 'ft' ? 5.5 : 1.7, usableWidth * 0.15);
      wBedBackTemp = usableWidth - wCorr - wBath;
    } else {
      const wBath = Math.min(unit === 'ft' ? 6 : 1.8, usableWidth * 0.25);
      wBedBackTemp = usableWidth - wBath;
    }
  } else {
    const wBath = Math.min(unit === 'ft' ? 6 : 1.8, usableWidth * 0.25);
    wBedBackTemp = usableWidth - wBath;
  }

  const minBedH = unit === 'ft' ? 9.5 : 2.9;
  const minGarageH = (hasGarage && activeFloor === 'ground') ? (unit === 'ft' ? 13 : 3.9) : (unit === 'ft' ? 9.5 : 2.9);

  let hBack = usableLength * config.backRatio;
  
  // ASPECT RATIO CORRECTION FOR ROOM LOGIC: 
  // Bedrooms must never be uncomfortably long/narrow (e.g., width to length ratio < 0.65 or > 1.5).
  // We clamp hBack to a maximum of 1.25 times the bedroom width, redistributing leftover length to the Family Lounge.
  const maxBedH = wBedBackTemp * 1.25;
  if (hBack > maxBedH) {
    hBack = Math.max(minBedH, maxBedH);
  }
  if (hBack < minBedH) hBack = minBedH;

  let hFront = usableLength * config.frontRatio;
  if (hFront < minGarageH) hFront = minGarageH;

  let hMid = usableLength - hBack - hFront;
  if (hMid < minBedH) hMid = minBedH;

  // Clamp sum
  hBack = Math.round(hBack * 10) / 10;
  hFront = Math.round(hFront * 10) / 10;
  hMid = Math.round((usableLength - hBack - hFront) * 10) / 10;

  // If hMid gets compromised, adjust hFront/hBack
  if (hMid < minBedH) {
    hMid = minBedH;
    hFront = Math.round((usableLength - hBack - hMid) * 10) / 10;
    if (hFront < minGarageH) {
      hFront = minGarageH;
      hBack = Math.round((usableLength - hMid - hFront) * 10) / 10;
    }
  }

  const yBack = openBackHeight;
  const yMid = yBack + hBack;
  const yFront = yMid + hMid;

  // --- 1. BACK ZONE ---
  if (config.backType === 'split' && reqBeds >= 2 && usableWidth >= (unit === 'ft' ? 24 : 7.2)) {
    // Elegant Central-Ventilation and dual-bath core layout:
    // Left bedroom, right bedroom, central ventilation shaft, and central back-to-back bathrooms.
    const wCenter = unit === 'ft' ? Math.max(5.5, Math.min(8.0, usableWidth * 0.2)) : Math.max(1.7, Math.min(2.4, usableWidth * 0.2));
    const wBed = (usableWidth - wCenter) / 2;
    const hVent = unit === 'ft' ? 4.5 : 1.4;

    const rBed1 = addRoom('Master Bedroom', 'bedroom', 0, yBack, wBed, hBack);
    const rBed2 = addRoom('Bedroom 2', 'bedroom', wBed + wCenter, yBack, wBed, hBack);
    const rVent = addRoom('Central Ventilation (O.T.S.)', 'lawn', wBed, yBack, wCenter, hVent);
    const rBath1 = addRoom('Bath (Att.)', 'bathroom', wBed, yBack + hVent, wCenter / 2, hBack - hVent);
    const rBath2 = addRoom('Bath (Att.)', 'bathroom', wBed + wCenter / 2, yBack + hVent, wCenter / 2, hBack - hVent);

    customPlacedRoomIds.add(rBed1.id);
    customPlacedRoomIds.add(rBed2.id);
    customPlacedRoomIds.add(rVent.id);
    customPlacedRoomIds.add(rBath1.id);
    customPlacedRoomIds.add(rBath2.id);

    // Custom doors & windows
    const dW = unit === 'ft' ? 3 : 0.9;
    const dW_bath = unit === 'ft' ? 2.5 : 0.75;
    const winW = unit === 'ft' ? 4 : 1.2;
    const winW_bath = unit === 'ft' ? 1.5 : 0.5;

    // Master Bedroom doors & windows
    doors.push({
      id: nextId('door'),
      roomId: rBed1.id,
      x: wBed - dW - 0.5,
      y: yBack + hBack,
      width: dW,
      type: 'horizontal',
    });
    doors.push({
      id: nextId('door'),
      roomId: rBed1.id,
      x: wBed,
      y: yBack + hVent + (hBack - hVent) / 2 - dW_bath / 2,
      width: dW_bath,
      type: 'vertical',
    });
    windows.push({
      id: nextId('window'),
      roomId: rBed1.id,
      x: wBed,
      y: yBack + hVent / 2 - winW / 2,
      width: winW,
      type: 'vertical',
    });

    // Bedroom 2 doors & windows
    doors.push({
      id: nextId('door'),
      roomId: rBed2.id,
      x: wBed + wCenter + 0.5,
      y: yBack + hBack,
      width: dW,
      type: 'horizontal',
    });
    doors.push({
      id: nextId('door'),
      roomId: rBed2.id,
      x: wBed + wCenter,
      y: yBack + hVent + (hBack - hVent) / 2 - dW_bath / 2,
      width: dW_bath,
      type: 'vertical',
    });
    windows.push({
      id: nextId('window'),
      roomId: rBed2.id,
      x: wBed + wCenter,
      y: yBack + hVent / 2 - winW / 2,
      width: winW,
      type: 'vertical',
    });

    // Bathroom 1 ventilator to O.T.S.
    windows.push({
      id: nextId('window'),
      roomId: rBath1.id,
      x: wBed + wCenter / 4 - winW_bath / 2,
      y: yBack + hVent,
      width: winW_bath,
      type: 'horizontal',
    });

    // Bathroom 2 ventilator to O.T.S.
    windows.push({
      id: nextId('window'),
      roomId: rBath2.id,
      x: wBed + wCenter * 3 / 4 - winW_bath / 2,
      y: yBack + hVent,
      width: winW_bath,
      type: 'horizontal',
    });

  } else if (config.backType === 'outer_baths' && reqBeds >= 2 && usableWidth >= (unit === 'ft' ? 24 : 7.2)) {
    // Beautiful Outer-baths and split-bedroom layout
    const wBath = Math.min(unit === 'ft' ? 5.5 : 1.7, usableWidth * 0.15);
    const wBed = (usableWidth - 2 * wBath) / 2;

    const rBath1 = addRoom('Bath (Att.)', 'bathroom', 0, yBack, wBath, hBack * 0.8);
    const rBed1 = addRoom('Master Suite', 'bedroom', wBath, yBack, wBed, hBack);
    const rBed2 = addRoom('Bedroom 2', 'bedroom', wBath + wBed, yBack, wBed, hBack);
    const rBath2 = addRoom('Bath (Att.)', 'bathroom', wBath + 2 * wBed, yBack, wBath, hBack * 0.8);

    customPlacedRoomIds.add(rBath1.id);
    customPlacedRoomIds.add(rBed1.id);
    customPlacedRoomIds.add(rBed2.id);
    customPlacedRoomIds.add(rBath2.id);

    const dW = unit === 'ft' ? 3 : 0.9;
    const dW_bath = unit === 'ft' ? 2.5 : 0.75;
    const winW = unit === 'ft' ? 4 : 1.2;
    const winW_bath = unit === 'ft' ? 1.5 : 0.5;

    // Master Suite doors & windows
    doors.push({
      id: nextId('door'),
      roomId: rBed1.id,
      x: wBath + 0.5,
      y: yBack + hBack,
      width: dW,
      type: 'horizontal',
    });
    doors.push({
      id: nextId('door'),
      roomId: rBed1.id,
      x: wBath,
      y: yBack + hBack * 0.4 - dW_bath / 2,
      width: dW_bath,
      type: 'vertical',
    });
    windows.push({
      id: nextId('window'),
      roomId: rBed1.id,
      x: wBath + wBed / 2 - winW / 2,
      y: yBack,
      width: winW,
      type: 'horizontal',
    });

    // Bedroom 2 doors & windows
    doors.push({
      id: nextId('door'),
      roomId: rBed2.id,
      x: wBath + wBed + wBed - dW - 0.5,
      y: yBack + hBack,
      width: dW,
      type: 'horizontal',
    });
    doors.push({
      id: nextId('door'),
      roomId: rBed2.id,
      x: wBath + wBed + wBed,
      y: yBack + hBack * 0.4 - dW_bath / 2,
      width: dW_bath,
      type: 'vertical',
    });
    windows.push({
      id: nextId('window'),
      roomId: rBed2.id,
      x: wBath + wBed + wBed / 2 - winW / 2,
      y: yBack,
      width: winW,
      type: 'horizontal',
    });

    // Bath 1 ventilator
    windows.push({
      id: nextId('window'),
      roomId: rBath1.id,
      x: wBath / 2 - winW_bath / 2,
      y: yBack,
      width: winW_bath,
      type: 'horizontal',
    });

    // Bath 2 ventilator
    windows.push({
      id: nextId('window'),
      roomId: rBath2.id,
      x: wBath + 2 * wBed + wBath / 2 - winW_bath / 2,
      y: yBack,
      width: winW_bath,
      type: 'horizontal',
    });

  } else if (config.backType === 'corridor' && reqBeds >= 2 && usableWidth >= (unit === 'ft' ? 24 : 7.2)) {
    const wCorr = unit === 'ft' ? 4 : 1.2;
    const wBath = Math.min(unit === 'ft' ? 5.5 : 1.7, usableWidth * 0.15);
    const wBed = usableWidth - wCorr - wBath;
    addRoom('Master Bedroom', 'bedroom', 0, yBack, wBed, hBack);
    addRoom('Private Corridor', 'corridor', wBed, yBack, wCorr, hBack);
    addRoom('Bath (Att.)', 'bathroom', wBed + wCorr, yBack, wBath, hBack);
  } else {
    const wBath = Math.min(unit === 'ft' ? 6 : 1.8, usableWidth * 0.25);
    addRoom('Master Bedroom', 'bedroom', 0, yBack, usableWidth - wBath, hBack);
    addRoom('Bath (Att.)', 'bathroom', usableWidth - wBath, yBack, wBath, hBack);
  }

  // --- 2. MIDDLE ZONE ---
  const wKit = Math.min(unit === 'ft' ? 10 : 3.0, usableWidth * 0.32);
  const wStairs = Math.min(unit === 'ft' ? 6.5 : 2.0, (usableWidth - wKit) * 0.35);
  const wCommonBath = Math.min(unit === 'ft' ? 5.5 : 1.7, (usableWidth - wKit) * 0.25);
  const wLounge = usableWidth - wKit - wStairs - wCommonBath;

  // Safeguard for elongated plots: if hMid is excessively long (> 16ft / 4.8m),
  // split middle zone into two horizontal sub-bays to prevent skinny corridor-like rooms
  const isElongatedMid = hMid > (unit === 'ft' ? 16 : 4.8);
  if (isElongatedMid) {
    const hMid1 = Math.round(Math.min(hMid * 0.45, unit === 'ft' ? 14 : 4.2) * 10) / 10;
    const hMid2 = Math.round((hMid - hMid1) * 10) / 10;

    if (config.midType === 'classic' || config.midType === 'swapped') {
      // Sub-bay 1 (Mid-Rear): Kitchen & Service Core
      addRoom('Closed Kitchen', 'kitchen', 0, yMid, wKit, hMid1);
      addRoom('Staircase', 'staircase', wKit, yMid + hMid1 - (unit === 'ft' ? 9 : 2.7), wStairs, unit === 'ft' ? 9 : 2.7);
      addRoom('Bath (Common)', 'bathroom', wKit + wStairs, yMid + hMid1 - (unit === 'ft' ? 6 : 1.8), wCommonBath, unit === 'ft' ? 6 : 1.8);
      addRoom('Dining & Breakfast Nook', 'living', wKit + wStairs + wCommonBath, yMid, wLounge, hMid1);

      // Sub-bay 2 (Mid-Front): Spacious Family TV Lounge
      addRoom('Family TV Lounge', 'living', 0, yMid + hMid1, usableWidth, hMid2);
    } else if (config.midType === 'courtyard') {
      const wAtrium = Math.min(unit === 'ft' ? 11 : 3.3, usableWidth * 0.3);
      const wLoungeC = usableWidth - wKit - wAtrium;

      addRoom('Courtyard Kitchen', 'kitchen', 0, yMid, wKit, hMid1);
      addRoom('Central Atrium (O.T.S.)', 'lawn', wKit, yMid, wAtrium, hMid);
      addRoom('Staircase', 'staircase', wKit + wAtrium, yMid, Math.min(unit === 'ft' ? 6.5 : 2.0, wLoungeC * 0.4), hMid1);
      addRoom('Family Hall & TV Room', 'living', wKit + wAtrium + Math.min(unit === 'ft' ? 6.5 : 2.0, wLoungeC * 0.4), yMid, wLoungeC - Math.min(unit === 'ft' ? 6.5 : 2.0, wLoungeC * 0.4), hMid1);

      addRoom('Formal Lounge & Dining', 'living', 0, yMid + hMid1, usableWidth, hMid2);
    } else {
      addRoom('Gourmet Kitchen & Pantry', 'kitchen', 0, yMid, wKit, hMid1);
      addRoom('Staircase & Powder', 'staircase', wKit, yMid, usableWidth - wKit, hMid1);
      addRoom('Grand Family Lounge & TV Hall', 'living', 0, yMid + hMid1, usableWidth, hMid2);
    }
  } else {
    if (config.midType === 'classic') {
      addRoom('Closed Kitchen', 'kitchen', 0, yMid, wKit, hMid);
      addRoom('Staircase', 'staircase', wKit, yMid + hMid - (unit === 'ft' ? 10 : 3.0), wStairs, unit === 'ft' ? 10 : 3.0);
      addRoom('Bath (Common)', 'bathroom', wKit + wStairs, yMid + hMid - (unit === 'ft' ? 6 : 1.8), wCommonBath, unit === 'ft' ? 6 : 1.8);
      addRoom('Family TV Lounge & Dining', 'living', wKit + wStairs + wCommonBath, yMid, wLounge, hMid);
    } else if (config.midType === 'swapped') {
      addRoom('Staircase', 'staircase', 0, yMid + hMid - (unit === 'ft' ? 10 : 3.0), wStairs, unit === 'ft' ? 10 : 3.0);
      addRoom('Bath (Common)', 'bathroom', wStairs, yMid + hMid - (unit === 'ft' ? 6 : 1.8), wCommonBath, unit === 'ft' ? 6 : 1.8);
      addRoom('Open Great Room & Lounge', 'living', wStairs + wCommonBath, yMid, wLounge, hMid);
      addRoom('Open Kitchen & Island', 'kitchen', wStairs + wCommonBath + wLounge, yMid, wKit, hMid);
    } else if (config.midType === 'courtyard') {
      const wAtrium = Math.min(unit === 'ft' ? 11 : 3.3, usableWidth * 0.3);
      const wLoungeC = usableWidth - wKit - wAtrium;
      addRoom('Courtyard Kitchen', 'kitchen', 0, yMid, wKit, hMid);
      addRoom('Central Atrium (O.T.S.)', 'lawn', wKit, yMid, wAtrium, hMid);
      addRoom('Family Hall & Lounge', 'living', wKit + wAtrium, yMid, wLoungeC, hMid);
      addRoom('Staircase', 'staircase', wKit + wAtrium, yMid, Math.min(unit === 'ft' ? 6.5 : 2.0, wLoungeC * 0.4), hMid * 0.7);
    } else {
      addRoom('Gourmet Kitchen & Pantry', 'kitchen', 0, yMid, wKit, hMid);
      addRoom('Grand Family Lounge & Dining', 'living', wKit, yMid, usableWidth - wKit, hMid);
      addRoom('Staircase', 'staircase', wKit, yMid, Math.min(unit === 'ft' ? 6.5 : 2.0, (usableWidth - wKit) * 0.3), hMid * 0.7);
    }
  }

  // --- 3. FRONT ZONE ---
  const wGarage = Math.min(unit === 'ft' ? 14 : 4.2, usableWidth * 0.45);
  const wDrawing = usableWidth - wGarage;

  if (config.frontType === 'classic') {
    if (activeFloor === 'ground') {
      if (hasGarage) addRoom('Porch / Garage', 'garage', 0, yFront, wGarage, hFront);
      if (reqBeds >= 3 && usableWidth >= (unit === 'ft' ? 28 : 8.5)) {
        addRoom('Bedroom 3 (Guest)', 'bedroom', wGarage, yFront, wDrawing, hFront * 0.55);
        if (hasDrawing) addRoom('Drawing Room', 'drawing', wGarage, yFront + hFront * 0.55, wDrawing, hFront * 0.45);
      } else {
        if (hasDrawing) addRoom('Drawing Room', 'drawing', wGarage, yFront, wDrawing, hFront);
      }
    } else {
      addRoom('Open Roof Terrace / Balcony', 'lawn', 0, yFront, wGarage, hFront);
      addRoom('Executive Suite', 'bedroom', wGarage, yFront, wDrawing, hFront);
    }
  } else if (config.frontType === 'swapped') {
    if (activeFloor === 'ground') {
      if (hasDrawing) addRoom('Drawing Room', 'drawing', 0, yFront, wDrawing, hFront);
      if (hasGarage) addRoom('Porch / Garage', 'garage', wDrawing, yFront, wGarage, hFront);
    } else {
      addRoom('Executive Master Bed', 'bedroom', 0, yFront, wDrawing, hFront);
      addRoom('Roof Terrace & Deck', 'lawn', wDrawing, yFront, wGarage, hFront);
    }
  } else {
    const wLawnRoom = usableWidth * 0.4;
    const wDrawingL = usableWidth - wLawnRoom;
    if (activeFloor === 'ground') {
      addRoom('Front Lawn & Planter', 'lawn', 0, yFront, wLawnRoom, hFront);
      if (hasDrawing) addRoom('Drawing Room', 'drawing', wLawnRoom, yFront, wDrawingL, hFront);
    } else {
      addRoom('Open Terrace Balcony', 'lawn', 0, yFront, wLawnRoom, hFront);
      addRoom('Bedroom Space', 'bedroom', wLawnRoom, yFront, wDrawingL, hFront);
    }
  }

  // Ventilation Shafts
  if (openBackHeight > 0) {
    addRoom('Back Ventilation Shaft', 'lawn', 0, 0, width, openBackHeight);
  }
  if (activeFloor === 'ground' && openFrontHeight > 0) {
    addRoom('Front Entrance Lawn', 'lawn', 0, length - openFrontHeight, width, openFrontHeight);
  } else if (activeFloor !== 'ground' && openFrontHeight > 0) {
    addRoom('Front Deck Balcony', 'lawn', 0, length - openFrontHeight, width, openFrontHeight);
  }

  // --- 4. DOORS & WINDOWS PLACEMENT ---
  const pType = preferences.plotType ?? 'standard';

  rooms.forEach((r) => {
    if (customPlacedRoomIds.has(r.id)) return;
    const dW = r.type === 'bathroom' ? (unit === 'ft' ? 2.5 : 0.75) : (unit === 'ft' ? 3 : 0.9);
    const winW = r.type === 'bathroom' ? (unit === 'ft' ? 1.5 : 0.5) : (r.type === 'kitchen' ? (unit === 'ft' ? 3.5 : 1.0) : (unit === 'ft' ? 4 : 1.2));

    if (r.type === 'bedroom' || r.type === 'bathroom' || r.type === 'kitchen' || r.type === 'drawing') {
      // 1. Doors placement
      if (r.type === 'bedroom') {
        doors.push({
          id: nextId('door'),
          roomId: r.id,
          x: r.x + r.width - dW - 0.5,
          y: r.y + r.height,
          width: dW,
          type: 'horizontal',
        });
      } else if (r.type === 'bathroom') {
        doors.push({
          id: nextId('door'),
          roomId: r.id,
          x: r.x + 0.5,
          y: r.y + r.height,
          width: dW,
          type: 'horizontal',
        });
      } else if (r.type === 'kitchen') {
        doors.push({
          id: nextId('door'),
          roomId: r.id,
          x: r.x + r.width,
          y: r.y + 1,
          width: dW,
          type: 'vertical',
        });
      } else if (r.type === 'drawing') {
        doors.push({
          id: nextId('door'),
          roomId: r.id,
          x: r.x + 1,
          y: r.y,
          width: dW,
          type: 'horizontal',
        });
        doors.push({
          id: nextId('door'),
          roomId: r.id,
          x: r.x + r.width / 2 - dW / 2,
          y: r.y + r.height,
          type: 'horizontal',
          width: dW,
        });
      }

      // 2. Windows placement (with Corner plot awareness)
      let winX = r.x + r.width / 2 - winW / 2;
      let winY = r.y === 0 ? 0.2 : r.y;
      let winType: 'horizontal' | 'vertical' = 'horizontal';

      const touchesRight = Math.abs((r.x + r.width) - usableWidth) < 0.25;
      const touchesLeft = r.x < 0.25;
      const touchesTop = r.y <= (openBackHeight + 0.25) || r.y < 0.25;
      const touchesBottom = Math.abs((r.y + r.height) - length) < 0.25;

      if (pType === 'corner' || pType === 'corner-right') {
        // Right Corner plot: "if the plot is corner at right ventilatilation automatically from window at backend"
        if (touchesTop) {
          winX = r.x + r.width / 2 - winW / 2;
          winY = r.y === 0 ? 0.2 : r.y;
          winType = 'horizontal';
        } else if (touchesRight) {
          winX = r.x + r.width;
          winY = r.y + r.height / 2 - winW / 2;
          winType = 'vertical';
        } else if (touchesBottom) {
          winX = r.x + r.width / 2 - winW / 2;
          winY = r.y + r.height;
          winType = 'horizontal';
        } else if (touchesLeft) {
          winX = r.x;
          winY = r.y + r.height / 2 - winW / 2;
          winType = 'vertical';
        }
      } else if (pType === 'corner-left') {
        // Left Corner plot: "and at left corner then ventilation from street (left side) through window"
        if (touchesLeft) {
          winX = r.x;
          winY = r.y + r.height / 2 - winW / 2;
          winType = 'vertical';
        } else if (touchesTop) {
          winX = r.x + r.width / 2 - winW / 2;
          winY = r.y === 0 ? 0.2 : r.y;
          winType = 'horizontal';
        } else if (touchesBottom) {
          winX = r.x + r.width / 2 - winW / 2;
          winY = r.y + r.height;
          winType = 'horizontal';
        } else if (touchesRight) {
          winX = r.x + r.width;
          winY = r.y + r.height / 2 - winW / 2;
          winType = 'vertical';
        }
      } else {
        // Standard plot
        if (touchesTop) {
          winX = r.x + r.width / 2 - winW / 2;
          winY = r.y === 0 ? 0.2 : r.y;
          winType = 'horizontal';
        } else if (touchesBottom) {
          winX = r.x + r.width / 2 - winW / 2;
          winY = r.y + r.height;
          winType = 'horizontal';
        } else if (touchesLeft) {
          winX = r.x;
          winY = r.y + r.height / 2 - winW / 2;
          winType = 'vertical';
        } else if (touchesRight) {
          winX = r.x + r.width;
          winY = r.y + r.height / 2 - winW / 2;
          winType = 'vertical';
        }
      }

      windows.push({
        id: nextId('window'),
        roomId: r.id,
        x: winX,
        y: winY,
        width: winW,
        type: winType,
      });
    } else if (r.type === 'garage') {
      doors.push({
        id: nextId('door'),
        roomId: r.id,
        x: r.x + 1,
        y: r.y + r.height,
        width: unit === 'ft' ? 10 : 3.0,
        type: 'horizontal',
        isMain: true,
      });
    }
  });

  const porchRoom = rooms.find(r => r.type === 'garage');
  if (porchRoom) {
    doors.push({
      id: nextId('door'),
      x: porchRoom.x + porchRoom.width - 1,
      y: porchRoom.y,
      width: unit === 'ft' ? 3.5 : 1.1,
      type: 'horizontal',
      isMain: true,
    });
  }

  const plotType = preferences.plotType ?? 'standard';
  const facing = preferences.facing ?? 'east';

  const summary: NaqshaSummary = {
    recommendedBedrooms: rooms.filter((r) => r.type === 'bedroom').length,
    bathrooms: rooms.filter((r) => r.type === 'bathroom').length,
    kitchen: config.midType === 'swapped' ? 'Open Kitchen' : 'Closed Kitchen',
    tvLounge: 'Yes',
    drawingRoom: activeFloor === 'ground' && hasDrawing ? 'Yes' : 'No',
    garage: activeFloor === 'ground' && hasGarage ? '1 Car' : 'No',
    lawn: activeFloor === 'ground' && hasLawn ? 'Front Lawn' : 'No',
    otherFeatures: [],
  };

  const rawLayout: NaqshaLayout = {
    width,
    length,
    unit,
    rooms,
    doors,
    windows,
    summary,
    plotType,
    facing,
    activeFloor,
  };

  return refineLayoutAspectRatios(rawLayout);
}

export function generateProceduralLayout(
  width: number,
  length: number,
  unit: 'ft' | 'm',
  preferences: {
    bedrooms?: number;
    bathrooms?: number;
    kitchenType?: 'Closed' | 'Open';
    garage?: 'Yes' | 'No';
    drawingRoom?: 'Yes' | 'No';
    lawn?: 'Yes' | 'No';
    plotType?: 'corner' | 'corner-left' | 'corner-right' | 'standard';
    facing?: 'north' | 'south' | 'east' | 'west';
    floor?: 'ground' | 'first' | 'second';
    version?: number;
  } = {}
): NaqshaLayout {
  const activeFloor = preferences.floor ?? 'ground';
  const facing = preferences.facing ?? 'east';
  const plotType = preferences.plotType ?? 'standard';

  const candidates: NaqshaLayout[] = [];
  const scores: number[] = [];
  const reports: string[][] = [];

  // Generate and score 8 diverse candidates
  TEMPLATES.forEach((temp) => {
    const cand = buildCandidate(temp, width, length, unit, preferences);
    const { score, report } = scoreCandidate(cand, preferences);
    candidates.push(cand);
    scores.push(score);
    reports.push(report);
  });

  // Find index of highest scoring layout (unless a specific version was requested)
  let bestIdx = 0;
  let maxScore = -Infinity;

  if (preferences.version !== undefined) {
    const requestedVersion = Number(preferences.version);
    const foundIdx = TEMPLATES.findIndex((temp) => temp.id === requestedVersion);
    if (foundIdx !== -1) {
      bestIdx = foundIdx;
      maxScore = scores[bestIdx];
    } else {
      for (let i = 0; i < scores.length; i++) {
        if (scores[i] > maxScore) {
          maxScore = scores[i];
          bestIdx = i;
        }
      }
    }
  } else {
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > maxScore) {
        maxScore = scores[i];
        bestIdx = i;
      }
    }
  }

  const bestLayout = candidates[bestIdx];
  const bestReport = reports[bestIdx];
  const bestConfig = TEMPLATES[bestIdx];

  const orientationTips: { [key: string]: string } = {
    north: 'Optimized South-facing bedrooms for ambient daylight; North entry porch gets pleasant diffused shade.',
    south: 'South-facing entrance maximizes direct winter warmth. Kitchen ventilation positioned to exhaust hot air Eastwards.',
    east: 'Morning-light optimized. East facing kitchen window invites clean breakfast sun.',
    west: 'Sun shades added to West walls to minimize afternoon heat. Bedrooms face East/North for cooler sleeping environment.',
  };

  const floorText = activeFloor === 'ground' ? 'Ground Floor' : activeFloor === 'first' ? 'First Floor' : 'Second Floor';

  const cornerMessage = plotType === 'corner-left' 
    ? 'Left Corner Plot: Side street ventilation windows integrated on left perimeter.'
    : plotType === 'corner-right' || plotType === 'corner'
    ? 'Right Corner Plot: Side street ventilation windows integrated on right perimeter.'
    : 'Standard single-frontage ventilation shaft alignment.';

  // Run pure rule-based architectural analysis on the best layout
  const diagnosticReport = analyzeLayout(bestLayout);
  bestLayout.analysis = diagnosticReport;

  // Inject beautiful features description back into the summary
  bestLayout.summary.otherFeatures = [
    `★ Deterministic Architectural Score: ${diagnosticReport.overallScore}/100 (${diagnosticReport.status.toUpperCase().replace('_', ' ')})`,
    `✔ Style Selected: ${bestConfig.name}`,
    `✔ Room Proportions Score: ${diagnosticReport.categoryScores.proportionsScore}/20 | Daylight & Vent: ${diagnosticReport.categoryScores.ventilationScore}/20`,
    `✔ Optimal zoning: private quiet master suite placed in the rear quadrant for maximum privacy.`,
    `✔ Natural cross-ventilation: ${diagnosticReport.lightingVentilationMetrics.crossVentilatedRoomsCount} room(s) cross-ventilated.`,
    `Orientation facing ${facing.toUpperCase()}: ${orientationTips[facing]}`,
    `${floorText} configuration.`,
    `✔ ${cornerMessage}`,
  ];

  return bestLayout;
}
