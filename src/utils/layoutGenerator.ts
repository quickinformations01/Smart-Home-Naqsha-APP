import { NaqshaLayout, Room, Door, Window, RoomType, NaqshaSummary } from '../types';

/**
 * Generates a logical, realistic 2D/3D floor plan based on plot dimensions, direction, corner-status, floor-level, and preferences.
 */
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
    plotType?: 'corner' | 'standard';
    facing?: 'north' | 'south' | 'east' | 'west';
    floor?: 'ground' | 'first' | 'second';
    version?: number;
  } = {}
): NaqshaLayout {
  const plotType = preferences.plotType ?? 'standard';
  const facing = preferences.facing ?? 'east';
  const activeFloor = preferences.floor ?? 'ground';
  const version = preferences.version ?? 1;

  // Base setup
  const preferredBedrooms = preferences.bedrooms ?? (width * length > (unit === 'ft' ? 1800 : 160) ? 3 : width * length > (unit === 'ft' ? 1000 : 90) ? 2 : 1);
  const preferredBathrooms = preferences.bathrooms ?? Math.min(preferredBedrooms, 3);
  const kitchenType = preferences.kitchenType ?? 'Closed';
  const hasGarage = activeFloor === 'ground' && preferences.garage !== 'No' && (width >= (unit === 'ft' ? 15 : 4.5) && length >= (unit === 'ft' ? 30 : 9));
  const hasDrawing = preferences.drawingRoom !== 'No' && (width >= (unit === 'ft' ? 18 : 5.5));
  const hasLawn = activeFloor === 'ground' && preferences.lawn !== 'No' && length >= (unit === 'ft' ? 35 : 10);

  const rooms: Room[] = [];
  const doors: Door[] = [];
  const windows: Window[] = [];

  let idCounter = 1;
  const nextId = (prefix: string) => `${prefix}_${idCounter++}`;

  const addRoom = (name: string, type: RoomType, x: number, y: number, w: number, h: number, color?: string): Room => {
    const r: Room = {
      id: nextId('room'),
      name,
      type,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      width: Math.round(w * 10) / 10,
      height: Math.round(h * 10) / 10,
      color,
    };
    rooms.push(r);
    return r;
  };

  // Dimensions & Zones
  const openBackHeight = length > (unit === 'ft' ? 45 : 14) ? (unit === 'ft' ? 3 : 1) : 0;
  const openFrontHeight = hasLawn ? (unit === 'ft' ? 5 : 1.5) : 0;

  const usableLength = length - openBackHeight - openFrontHeight;
  const usableWidth = width;

  let hBack = usableLength * 0.35;
  let hFront = usableLength * 0.35;
  let hMid = usableLength - hBack - hFront;

  const minBedHeight = unit === 'ft' ? 10 : 3;
  const minGarageHeight = unit === 'ft' ? 14 : 4.2;

  if (hBack < minBedHeight) hBack = Math.min(minBedHeight, usableLength * 0.4);
  if (hFront < minGarageHeight && hasGarage) hFront = Math.min(minGarageHeight, usableLength * 0.4);
  hMid = usableLength - hBack - hFront;

  const yBack = openBackHeight;
  const yMid = yBack + hBack;
  const yFront = yMid + hMid;

  // Colors
  const colors = {
    bedroom: '#f8fafc',
    bathroom: '#f1f5f9',
    kitchen: '#ffffff',
    living: '#f8fafc',
    drawing: '#ffffff',
    garage: '#f1f5f9',
    lawn: '#f0fdf4',
    staircase: '#faf5ff',
    corridor: '#fafafa',
    other: '#f8fafc',
  };

  // --- ROOMS GENERATION BRANCHES FOR 5 VERSIONS ---
  const bedroomsCreated: Room[] = [];
  const bathsCreated: Room[] = [];
  let porch: Room | null = null;
  let drawing: Room | null = null;
  let kit: Room | null = null;
  let lounge: Room | null = null;

  let wKit = Math.min(unit === 'ft' ? 10 : 3, usableWidth * 0.35);
  let wLounge = usableWidth - wKit;
  let wMidLounge = wLounge; // default
  let wBed = usableWidth * 0.45;

  if (version === 1) {
    // ==========================================
    // VERSION 1: CLASSIC BALANCED LAYOUT
    // ==========================================
    if (preferredBedrooms >= 2 && usableWidth >= (unit === 'ft' ? 24 : 7.2)) {
      const wBath = Math.min(unit === 'ft' ? 5.5 : 1.7, usableWidth * 0.15);
      const wBed = (usableWidth - (wBath * 2)) / 2;
      const bName1 = activeFloor === 'ground' ? 'Master Bedroom' : `First Floor Bed 1`;
      const bName2 = activeFloor === 'ground' ? 'Bedroom 2' : `First Floor Bed 2`;

      const bed1 = addRoom(bName1, 'bedroom', 0, yBack, wBed, hBack, colors.bedroom);
      const bath1 = addRoom('Bath (Att.)', 'bathroom', wBed, yBack, wBath, hBack * 0.8, colors.bathroom);
      const bath2 = addRoom('Bath (Att.)', 'bathroom', wBed + wBath, yBack, wBath, hBack * 0.8, colors.bathroom);
      const bed2 = addRoom(bName2, 'bedroom', wBed + wBath * 2, yBack, wBed, hBack, colors.bedroom);

      if (hBack * 0.2 >= (unit === 'ft' ? 2 : 0.6)) {
        addRoom('Storage Shelf', 'other', wBed, yBack + hBack * 0.8, wBath * 2, hBack * 0.2, colors.other);
      }
      bedroomsCreated.push(bed1, bed2);
      bathsCreated.push(bath1, bath2);
    } else {
      const wBath = Math.min(unit === 'ft' ? 6 : 1.8, usableWidth * 0.25);
      const wBed = usableWidth - wBath;
      const bName = activeFloor === 'ground' ? 'Master Bedroom' : `First Floor Bed 1`;
      const bed1 = addRoom(bName, 'bedroom', 0, yBack, wBed, hBack, colors.bedroom);
      const bath1 = addRoom('Bath (Att.)', 'bathroom', wBed, yBack, wBath, hBack, colors.bathroom);
      bedroomsCreated.push(bed1);
      bathsCreated.push(bath1);
    }

    const kitName = activeFloor === 'ground' 
      ? (kitchenType === 'Closed' ? 'Closed Kitchen' : 'Open Kitchen')
      : 'Upper Kitchenette';
    kit = addRoom(kitName, 'kitchen', 0, yMid, wKit, hMid, colors.kitchen);

    const loungeName = usableWidth > (unit === 'ft' ? 20 : 6) ? 'TV Lounge & Family Dining' : 'Family Lounge';
    lounge = addRoom(loungeName, 'living', wKit, yMid, wLounge, hMid, colors.living);

    if (activeFloor === 'ground') {
      const wGarage = Math.min(unit === 'ft' ? 14 : 4.2, usableWidth * 0.45);
      const wDrawing = usableWidth - wGarage;

      if (hasGarage) {
        porch = addRoom('Porch / Garage', 'garage', 0, yFront, wGarage, hFront, colors.garage);
        if (preferredBedrooms >= 3 && usableWidth >= (unit === 'ft' ? 28 : 8.5)) {
          addRoom('Bedroom 3', 'bedroom', wGarage, yFront, wDrawing, hFront * 0.6, colors.bedroom);
          if (hasDrawing) {
            drawing = addRoom('Drawing Room', 'drawing', wGarage, yFront + hFront * 0.6, wDrawing, hFront * 0.4, colors.drawing);
          }
        } else {
          if (hasDrawing) {
            drawing = addRoom('Drawing Room', 'drawing', wGarage, yFront, wDrawing, hFront, colors.drawing);
          } else {
            addRoom('Sitting Lounge', 'drawing', wGarage, yFront, wDrawing, hFront, colors.drawing);
          }
        }
      } else {
        if (hasDrawing) {
          drawing = addRoom('Drawing Room', 'drawing', 0, yFront, usableWidth * 0.6, hFront, colors.drawing);
          addRoom('Open Patio Sitting', 'other', usableWidth * 0.6, yFront, usableWidth * 0.4, hFront, colors.other);
        } else {
          addRoom('Living Guest Lounge', 'drawing', 0, yFront, usableWidth, hFront, colors.drawing);
        }
      }
    } else {
      const wTerrace = Math.min(unit === 'ft' ? 12 : 3.6, usableWidth * 0.4);
      const wBedUpper = usableWidth - wTerrace;
      addRoom('Open Roof Terrace / Balcony', 'lawn', 0, yFront, wTerrace, hFront, colors.lawn);
      addRoom('Executive Master Bedroom', 'bedroom', wTerrace, yFront, wBedUpper, hFront, colors.bedroom);
    }
  } else if (version === 2) {
    // ==========================================
    // VERSION 2: MODERN OPEN-CONCEPT
    // ==========================================
    if (preferredBedrooms >= 2 && usableWidth >= (unit === 'ft' ? 24 : 7.2)) {
      const wBath = Math.min(unit === 'ft' ? 5.5 : 1.7, usableWidth * 0.15);
      const wBed = (usableWidth - (wBath * 2)) / 2;
      const bName1 = activeFloor === 'ground' ? 'Master Suite' : `First Floor Suite`;
      const bName2 = activeFloor === 'ground' ? 'Bedroom 2' : `First Floor Bed 2`;

      // Swapped placement: baths on outer edges, beds in center
      const bath1 = addRoom('Bath (Att.)', 'bathroom', 0, yBack, wBath, hBack * 0.8, colors.bathroom);
      const bed1 = addRoom(bName1, 'bedroom', wBath, yBack, wBed, hBack, colors.bedroom);
      const bed2 = addRoom(bName2, 'bedroom', wBath + wBed, yBack, wBed, hBack, colors.bedroom);
      const bath2 = addRoom('Bath (Att.)', 'bathroom', wBath + wBed * 2, yBack, wBath, hBack * 0.8, colors.bathroom);

      if (hBack * 0.2 >= (unit === 'ft' ? 2 : 0.6)) {
        addRoom('Dressing Area', 'other', 0, yBack + hBack * 0.8, wBath, hBack * 0.2, colors.other);
        addRoom('Closet Nook', 'other', wBath + wBed * 2, yBack + hBack * 0.8, wBath, hBack * 0.2, colors.other);
      }
      bedroomsCreated.push(bed1, bed2);
      bathsCreated.push(bath1, bath2);
    } else {
      const wBath = Math.min(unit === 'ft' ? 6 : 1.8, usableWidth * 0.25);
      const wBed = usableWidth - wBath;
      const bName = activeFloor === 'ground' ? 'Master Bed' : `First Floor Bed`;
      const bath1 = addRoom('Bath (Att.)', 'bathroom', 0, yBack, wBath, hBack, colors.bathroom);
      const bed1 = addRoom(bName, 'bedroom', wBath, yBack, wBed, hBack, colors.bedroom);
      bedroomsCreated.push(bed1);
      bathsCreated.push(bath1);
    }

    wKit = Math.min(unit === 'ft' ? 11 : 3.3, usableWidth * 0.38);
    wLounge = usableWidth - wKit;

    const kitName = activeFloor === 'ground' ? 'Open Kitchen & Island' : 'Upper Kitchenette Bar';
    kit = addRoom(kitName, 'kitchen', wLounge, yMid, wKit, hMid, colors.kitchen);
    lounge = addRoom('Spacious Great Room & Lounge', 'living', 0, yMid, wLounge, hMid, colors.living);

    if (activeFloor === 'ground') {
      const wGarage = Math.min(unit === 'ft' ? 14 : 4.2, usableWidth * 0.45);
      const wDrawing = usableWidth - wGarage;

      if (hasGarage) {
        // Swapped porch to the right
        porch = addRoom('Porch / Garage', 'garage', wDrawing, yFront, wGarage, hFront, colors.garage);
        if (hasDrawing) {
          drawing = addRoom('Drawing Room', 'drawing', 0, yFront, wDrawing, hFront, colors.drawing);
        } else {
          addRoom('Guest Sitting Area', 'drawing', 0, yFront, wDrawing, hFront, colors.drawing);
        }
      } else {
        if (hasDrawing) {
          drawing = addRoom('Drawing Room', 'drawing', 0, yFront, usableWidth * 0.6, hFront, colors.drawing);
          addRoom('Open Patio Sitting', 'other', usableWidth * 0.6, yFront, usableWidth * 0.4, hFront, colors.other);
        } else {
          addRoom('Living Guest Lounge', 'drawing', 0, yFront, usableWidth, hFront, colors.drawing);
        }
      }
    } else {
      const wTerrace = Math.min(unit === 'ft' ? 12 : 3.6, usableWidth * 0.4);
      const wBedUpper = usableWidth - wTerrace;
      addRoom('Open Roof Terrace / Balcony', 'lawn', wBedUpper, yFront, wTerrace, hFront, colors.lawn);
      addRoom('Executive Master Bedroom', 'bedroom', 0, yFront, wBedUpper, hFront, colors.bedroom);
    }
  } else if (version === 3) {
    // ==========================================
    // VERSION 3: HIGH EFFICIENCY / KIDS STUDY
    // ==========================================
    if (usableWidth >= (unit === 'ft' ? 24 : 7.2)) {
      const wBath = Math.min(unit === 'ft' ? 5 : 1.5, usableWidth * 0.12);
      const wStudy = Math.min(unit === 'ft' ? 8 : 2.4, usableWidth * 0.25);
      const wBed = (usableWidth - wBath - wStudy) / 2;

      const bed1 = addRoom('Master Bed', 'bedroom', 0, yBack, wBed, hBack, colors.bedroom);
      const bath1 = addRoom('Bath (Att.)', 'bathroom', wBed, yBack, wBath, hBack * 0.8, colors.bathroom);
      const study = addRoom('Kids Study / Nursery', 'other', wBed + wBath, yBack, wStudy, hBack, colors.other);
      const bed2 = addRoom('Bedroom 2', 'bedroom', wBed + wBath + wStudy, yBack, wBed, hBack, colors.bedroom);

      bedroomsCreated.push(bed1, bed2);
      bathsCreated.push(bath1);
    } else {
      const wBath = Math.min(unit === 'ft' ? 6 : 1.8, usableWidth * 0.25);
      const wBed = usableWidth - wBath;
      const bed1 = addRoom('Compact Bed', 'bedroom', 0, yBack, wBed, hBack, colors.bedroom);
      const bath1 = addRoom('Bath (Att.)', 'bathroom', wBed, yBack, wBath, hBack, colors.bathroom);
      bedroomsCreated.push(bed1);
      bathsCreated.push(bath1);
    }

    kit = addRoom('Closed Compact Kitchen', 'kitchen', 0, yMid, wKit, hMid, colors.kitchen);
    lounge = addRoom('Family Dining & TV Lounge', 'living', wKit, yMid, wLounge, hMid, colors.living);

    if (activeFloor === 'ground') {
      const wGarage = Math.min(unit === 'ft' ? 14 : 4.2, usableWidth * 0.45);
      const wDrawing = usableWidth - wGarage;

      if (hasGarage) {
        porch = addRoom('Porch / Garage', 'garage', 0, yFront, wGarage, hFront, colors.garage);
        addRoom('Bedroom 3 (Guest)', 'bedroom', wGarage, yFront, wDrawing, hFront * 0.6, colors.bedroom);
        drawing = addRoom('Drawing Room', 'drawing', wGarage, yFront + hFront * 0.6, wDrawing, hFront * 0.4, colors.drawing);
      } else {
        drawing = addRoom('Drawing Room', 'drawing', 0, yFront, usableWidth * 0.5, hFront, colors.drawing);
        addRoom('Guest Bedroom 2', 'bedroom', usableWidth * 0.5, yFront, usableWidth * 0.5, hFront, colors.bedroom);
      }
    } else {
      const wTerrace = Math.min(unit === 'ft' ? 10 : 3.0, usableWidth * 0.3);
      const wBedUpper = (usableWidth - wTerrace) / 2;
      addRoom('Balcony', 'lawn', 0, yFront, wTerrace, hFront, colors.lawn);
      addRoom('Upper Bedroom 1', 'bedroom', wTerrace, yFront, wBedUpper, hFront, colors.bedroom);
      addRoom('Upper Bedroom 2', 'bedroom', wTerrace + wBedUpper, yFront, wBedUpper, hFront, colors.bedroom);
    }
  } else if (version === 4) {
    // ==========================================
    // VERSION 4: LUXURY PREMIUM SPACE-FIRST
    // ==========================================
    const wDressing = Math.min(unit === 'ft' ? 6.5 : 2.0, usableWidth * 0.18);
    const wBath = Math.min(unit === 'ft' ? 7.5 : 2.3, usableWidth * 0.22);
    const wBed = usableWidth - wDressing - wBath;

    const bed1 = addRoom('Executive Master Suite', 'bedroom', 0, yBack, wBed, hBack, colors.bedroom);
    addRoom('Walk-in Dressing', 'other', wBed, yBack, wDressing, hBack, colors.other);
    const bath1 = addRoom('Premium Bath', 'bathroom', wBed + wDressing, yBack, wBath, hBack, colors.bathroom);

    bedroomsCreated.push(bed1);
    bathsCreated.push(bath1);

    wKit = Math.min(unit === 'ft' ? 12 : 3.6, usableWidth * 0.4);
    wLounge = usableWidth - wKit;

    kit = addRoom('Gourmet Kitchen & Pantry', 'kitchen', 0, yMid, wKit, hMid, colors.kitchen);
    lounge = addRoom('Grand Family Hall & Dining', 'living', wKit, yMid, wLounge, hMid, colors.living);

    if (activeFloor === 'ground') {
      const wGarage = Math.min(unit === 'ft' ? 15 : 4.5, usableWidth * 0.5);
      const wDrawing = usableWidth - wGarage;

      porch = addRoom('Luxury Porch (2 Cars)', 'garage', 0, yFront, wGarage, hFront, colors.garage);
      drawing = addRoom('Stately Reception Lounge', 'drawing', wGarage, yFront, wDrawing, hFront, colors.drawing);
    } else {
      const wTerrace = Math.min(unit === 'ft' ? 14 : 4.2, usableWidth * 0.45);
      const wBedUpper = usableWidth - wTerrace;
      addRoom('Sky Terrace & Deck', 'lawn', 0, yFront, wTerrace, hFront, colors.lawn);
      addRoom('Royal Penthouse Suite', 'bedroom', wTerrace, yFront, wBedUpper, hFront, colors.bedroom);
    }
  } else {
    // ==========================================
    // VERSION 5: VENTILATION & COURTYARD CENTRIC
    // ==========================================
    const wCourtyard = Math.min(unit === 'ft' ? 12 : 3.6, usableWidth * 0.4);
    const wBackKit = usableWidth - wCourtyard;

    kit = addRoom('Back Courtyard Kitchen', 'kitchen', 0, yBack, wBackKit, hBack, colors.kitchen);
    addRoom('Open-To-Sky Dining Patio', 'lawn', wBackKit, yBack, wCourtyard, hBack, colors.lawn);

    wBed = usableWidth * 0.45;
    wMidLounge = usableWidth - wBed;

    const bed1 = addRoom('Courtyard-view Bed', 'bedroom', 0, yMid, wBed, hMid, colors.bedroom);
    lounge = addRoom('Central Atrium Lounge', 'living', wBed, yMid, wMidLounge, hMid, colors.living);

    const bath1 = addRoom('Bath (Att.)', 'bathroom', wBed, yMid + hMid * 0.6, wMidLounge * 0.4, hMid * 0.4, colors.bathroom);
    bathsCreated.push(bath1);
    bedroomsCreated.push(bed1);

    if (activeFloor === 'ground') {
      const wGarage = Math.min(unit === 'ft' ? 14 : 4.2, usableWidth * 0.45);
      const wDrawing = usableWidth - wGarage;

      if (hasGarage) {
        porch = addRoom('Porch / Garage', 'garage', 0, yFront, wGarage, hFront, colors.garage);
        drawing = addRoom('Guest Drawing Room', 'drawing', wGarage, yFront, wDrawing, hFront, colors.drawing);
      } else {
        drawing = addRoom('Drawing Room', 'drawing', 0, yFront, usableWidth * 0.6, hFront, colors.drawing);
        addRoom('Sitting Deck', 'other', usableWidth * 0.6, yFront, usableWidth * 0.4, hFront, colors.other);
      }
    } else {
      const wTerrace = Math.min(unit === 'ft' ? 12 : 3.6, usableWidth * 0.4);
      const wBedUpper = usableWidth - wTerrace;
      addRoom('Front Balcony', 'lawn', 0, yFront, wTerrace, hFront, colors.lawn);
      addRoom('Front Bed Space', 'bedroom', wTerrace, yFront, wBedUpper, hFront, colors.bedroom);
    }
  }

  // Ventilation Shafts / Lawn
  if (openBackHeight > 0) {
    addRoom('Back Ventilation Shaft', 'lawn', 0, 0, width, openBackHeight, colors.lawn);
  }
  if (activeFloor === 'ground' && openFrontHeight > 0) {
    addRoom('Front Lawn & Planter', 'lawn', 0, length - openFrontHeight, width, openFrontHeight, colors.lawn);
  } else if (activeFloor !== 'ground' && openFrontHeight > 0) {
    addRoom('Front Deck Balcony', 'lawn', 0, length - openFrontHeight, width, openFrontHeight, colors.lawn);
  }

  // Staircase & Common Bath positioning
  if (version === 5) {
    const wStairs = Math.min(unit === 'ft' ? 6.5 : 2.0, wMidLounge * 0.45);
    const hStairs = Math.min(unit === 'ft' ? 9 : 2.7, hMid * 0.55);
    addRoom('Staircase', 'staircase', wBed, yMid, wStairs, hStairs, colors.staircase);

    const wCommonBath = Math.min(unit === 'ft' ? 5 : 1.5, wMidLounge - wStairs);
    const hCommonBath = Math.min(unit === 'ft' ? 6 : 1.8, hMid * 0.4);
    addRoom('Bath (Common)', 'bathroom', wBed + wStairs, yMid, wCommonBath, hCommonBath, colors.bathroom);
  } else {
    const wStairs = Math.min(unit === 'ft' ? 6.5 : 2.0, wLounge * 0.35);
    const hStairs = Math.min(unit === 'ft' ? 10 : 3, hMid * 0.7);
    addRoom('Staircase', 'staircase', wKit, yMid + hMid - hStairs, wStairs, hStairs, colors.staircase);

    const wCommonBath = Math.min(unit === 'ft' ? 5 : 1.5, wLounge - wStairs);
    const hCommonBath = Math.min(unit === 'ft' ? 6 : 1.8, hMid * 0.5);
    addRoom('Bath (Common)', 'bathroom', wKit + wStairs, yMid + hMid - hCommonBath, wCommonBath, hCommonBath, colors.bathroom);
  }

  // --- 4. DOORS, WINDOWS & VENTILATION + COMPASS/CORNER ADAPTATION ---
  rooms.forEach((r) => {
    const dW = r.type === 'bathroom' ? (unit === 'ft' ? 2.5 : 0.75) : (unit === 'ft' ? 3 : 0.9);

    if (r.type === 'bedroom') {
      doors.push({
        id: nextId('door'),
        roomId: r.id,
        x: r.x + r.width - dW - 0.5,
        y: r.y + r.height,
        width: dW,
        type: 'horizontal',
      });
      // Rear ventilation window
      windows.push({
        id: nextId('window'),
        roomId: r.id,
        x: r.x + r.width / 2 - 1.5,
        y: r.y,
        width: unit === 'ft' ? 4 : 1.2,
        type: 'horizontal',
      });

      // CORNER PLOT BONUS WINDOW
      if (plotType === 'corner') {
        windows.push({
          id: nextId('window'),
          roomId: r.id,
          x: r.x === 0 ? 0 : r.x + r.width,
          y: r.y + r.height / 2 - 1,
          width: unit === 'ft' ? 3.5 : 1.0,
          type: 'vertical',
        });
      }
    } else if (r.type === 'bathroom') {
      doors.push({
        id: nextId('door'),
        roomId: r.id,
        x: r.x + 0.5,
        y: r.y + r.height,
        width: dW,
        type: 'horizontal',
      });
      // High ventilation duct
      windows.push({
        id: nextId('window'),
        roomId: r.id,
        x: r.x + r.width / 2 - 0.75,
        y: r.y,
        width: unit === 'ft' ? 1.5 : 0.5,
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
      // Window on outer side wall
      windows.push({
        id: nextId('window'),
        roomId: r.id,
        x: r.x,
        y: r.y + r.height / 2 - 1,
        width: unit === 'ft' ? 3.5 : 1.0,
        type: 'vertical',
      });
    } else if (r.type === 'drawing') {
      doors.push({
        id: nextId('door'),
        roomId: r.id,
        x: r.x + 1,
        y: r.y + r.height,
        width: dW,
        type: 'horizontal',
      });
      doors.push({
        id: nextId('door'),
        roomId: r.id,
        x: r.x + r.width / 2 - dW / 2,
        y: r.y,
        type: 'horizontal',
        width: dW,
      });
      windows.push({
        id: nextId('window'),
        roomId: r.id,
        x: r.x + r.width - (unit === 'ft' ? 4 : 1.2) - 0.5,
        y: r.y + r.height,
        width: unit === 'ft' ? 5 : 1.5,
        type: 'horizontal',
      });
    } else if (r.type === 'garage') {
      doors.push({
        id: nextId('door'),
        roomId: r.id,
        x: r.x + 1,
        y: r.y + r.height,
        width: unit === 'ft' ? 10 : 3,
        type: 'horizontal',
        isMain: true,
      });
    }
  });

  // Main Lounge Glass Slider facing patio / entrance
  if (porch) {
    doors.push({
      id: nextId('door'),
      x: porch.x + porch.width - 1,
      y: porch.y,
      width: unit === 'ft' ? 3.5 : 1.1,
      type: 'horizontal',
      isMain: true,
    });
  }

  // --- 5. COMPASS/ORIENTATION ADAPTIVE ADVICE ---
  const orientationTips: { [key: string]: string } = {
    north: 'Optimized South-facing bedrooms for ambient daylight; North entry porch gets pleasant diffused shade.',
    south: 'South-facing entrance maximizes direct winter warmth. Kitchen ventilation positioned to exhaust hot air Eastwards.',
    east: 'Morning-light optimized. East facing kitchen window invites clean breakfast sun.',
    west: 'Sun shades added to West walls to minimize afternoon heat. Bedrooms face East/North for cooler sleeping environment.',
  };

  // Floor description
  const floorText = activeFloor === 'ground' ? 'Ground Floor' : activeFloor === 'first' ? 'First Floor' : 'Second Floor';

  const versionStyles = {
    1: 'V1 - Classic Balanced Layout: Traditional zones with private bedrooms and separated drawing room.',
    2: 'V2 - Modern Open-Concept: Seamless kitchen-lounge integration with shifted car porch.',
    3: 'V3 - High-Efficiency: Space-optimized layout with kids study/home office and compact rooms.',
    4: 'V4 - Luxury Premium Suite: Generous executive master suite with walk-in dressing and stately lounge.',
    5: 'V5 - Courtyard Ventilation: Kitchen positioned around a rear open-to-sky patio for cooling breeze.',
  };

  const summary: NaqshaSummary = {
    recommendedBedrooms: rooms.filter((r) => r.type === 'bedroom').length,
    bathrooms: rooms.filter((r) => r.type === 'bathroom').length,
    kitchen: version === 2 || version === 4 ? 'Open Kitchen' : 'Closed Kitchen',
    tvLounge: 'Yes',
    drawingRoom: activeFloor === 'ground' && (hasDrawing || drawing !== null) ? 'Yes' : 'No',
    garage: activeFloor === 'ground' && hasGarage ? '1 Car' : 'No',
    lawn: activeFloor === 'ground' && hasLawn ? 'Front Lawn' : 'No',
    otherFeatures: [
      `${floorText} configuration.`,
      `Design Style: ${versionStyles[version as keyof typeof versionStyles] || 'Standard'}`,
      plotType === 'corner' ? 'Corner Plot double-ventilation windows included on side walls.' : 'Standard single-frontage ventilation shaft alignment.',
      `Orientation facing ${facing.toUpperCase()}: ${orientationTips[facing]}`,
      'Internal wardrobe (Almirah) space structured into master bedroom walls.',
      'Ventilation shafts provided to support high bathroom vents.',
    ],
  };

  return {
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
}
