import { NaqshaLayout, Room, Door, Window, FurnitureItem } from '../types';

/**
 * Helper to check which walls of a room are blocked by doors or windows.
 */
function getBlockedWalls(room: Room, layout: NaqshaLayout) {
  const blocked = {
    back: false,  // y = ry (horizontal, top wall)
    front: false, // y = ry + rh (horizontal, bottom wall)
    left: false,  // x = rx (vertical, left wall)
    right: false  // x = rx + rw (vertical, right wall)
  };

  const epsilon = 0.5; // tolerance for alignment in units

  // Check doors
  layout.doors.forEach(door => {
    const dW = door.width;
    if (door.type === 'horizontal') {
      if (Math.abs(door.y - room.y) < epsilon && door.x + dW > room.x && door.x < room.x + room.width) {
        blocked.back = true;
      }
      if (Math.abs(door.y - (room.y + room.height)) < epsilon && door.x + dW > room.x && door.x < room.x + room.width) {
        blocked.front = true;
      }
    } else {
      if (Math.abs(door.x - room.x) < epsilon && door.y + dW > room.y && door.y < room.y + room.height) {
        blocked.left = true;
      }
      if (Math.abs(door.x - (room.x + room.width)) < epsilon && door.y + dW > room.y && door.y < room.y + room.height) {
        blocked.right = true;
      }
    }
  });

  // Check windows
  layout.windows.forEach(win => {
    const wW = win.width;
    if (win.type === 'horizontal') {
      if (Math.abs(win.y - room.y) < epsilon && win.x + wW > room.x && win.x < room.x + room.width) {
        blocked.back = true;
      }
      if (Math.abs(win.y - (room.y + room.height)) < epsilon && win.x + wW > room.x && win.x < room.x + room.width) {
        blocked.front = true;
      }
    } else {
      if (Math.abs(win.x - room.x) < epsilon && win.y + wW > room.y && win.y < room.y + room.height) {
        blocked.left = true;
      }
      if (Math.abs(win.x - (room.x + room.width)) < epsilon && win.y + wW > room.y && win.y < room.y + room.height) {
        blocked.right = true;
      }
    }
  });

  return blocked;
}

/**
 * Intelligent procedural solver that populates furniture in rooms using spatial constraints
 */
export function autoFurnishLayout(layout: NaqshaLayout): NaqshaLayout {
  let idCounter = 1;
  const nextId = (prefix: string) => `${prefix}_${idCounter++}_${Math.random().toString(36).substring(2, 6)}`;

  const furnishedRooms = layout.rooms.map(room => {
    const rw = room.width;
    const rh = room.height;
    
    // Skip if it is corridor or other very narrow room
    if (room.type === 'corridor' || rw < 4 || rh < 4) {
      return { ...room, furniture: [] };
    }

    const blocked = getBlockedWalls(room, layout);
    const furniture: FurnitureItem[] = [];

    if (room.type === 'bedroom') {
      // Find a clear wall for the bed headboard
      let wall: 'back' | 'left' | 'right' | 'front' = 'back';
      if (!blocked.back) wall = 'back';
      else if (!blocked.left) wall = 'left';
      else if (!blocked.right) wall = 'right';
      else if (!blocked.front) wall = 'front';

      const bedW = Math.min(6, rw * 0.65);
      const bedL = Math.min(6.5, rh * 0.7);
      
      let bx = 0;
      let by = 0;
      let rot = 0;

      if (wall === 'back') {
        bx = (rw - bedW) / 2;
        by = 0.5;
        rot = 0;
      } else if (wall === 'left') {
        bx = 0.5;
        by = (rh - bedL) / 2;
        rot = 90;
      } else if (wall === 'right') {
        bx = rw - bedW - 0.5;
        by = (rh - bedL) / 2;
        rot = 270;
      } else {
        bx = (rw - bedW) / 2;
        by = rh - bedL - 0.5;
        rot = 180;
      }

      // Add double bed
      furniture.push({
        id: nextId('bed'),
        type: 'bed',
        x: bx,
        y: by,
        z: 0,
        width: bedW,
        length: bedL,
        height: 1.4,
        rotation: rot,
        color: '#78350f',
        secondaryColor: '#4f46e5',
        name: 'Premium Double Bed'
      });

      // Add nightstands if clearance allows
      if (wall === 'back' || wall === 'front') {
        const standW = 1.3;
        const standL = 1.3;
        // Check space to left and right of bed
        if (bx >= standW + 0.3) {
          furniture.push({
            id: nextId('stand'),
            type: 'nightstand',
            x: bx - standW - 0.1,
            y: by,
            z: 0,
            width: standW,
            length: standL,
            height: 0.9,
            rotation: rot,
            color: '#1e1b4b',
            name: 'Nightstand Left'
          });
        }
        if (rw - (bx + bedW) >= standW + 0.3) {
          furniture.push({
            id: nextId('stand'),
            type: 'nightstand',
            x: bx + bedW + 0.1,
            y: by,
            z: 0,
            width: standW,
            length: standL,
            height: 0.9,
            rotation: rot,
            color: '#1e1b4b',
            name: 'Nightstand Right'
          });
        }
      }

      // Add Almirah wardrobe along another unblocked wall
      const almW = Math.min(4.5, rw * 0.5);
      const almL = 1.6;
      let almPlaced = false;

      // Try perpendicular walls
      if (wall === 'back' || wall === 'front') {
        if (!blocked.left) {
          furniture.push({
            id: nextId('wardrobe'),
            type: 'wardrobe',
            x: 0.5,
            y: (rh - almW) / 2,
            z: 0,
            width: almL,
            length: almW,
            height: 1.8,
            rotation: 90,
            color: '#78350f',
            name: 'Wardrobe'
          });
          almPlaced = true;
        } else if (!blocked.right) {
          furniture.push({
            id: nextId('wardrobe'),
            type: 'wardrobe',
            x: rw - almL - 0.5,
            y: (rh - almW) / 2,
            z: 0,
            width: almL,
            length: almW,
            height: 1.8,
            rotation: 270,
            color: '#78350f',
            name: 'Wardrobe'
          });
          almPlaced = true;
        }
      }

      if (!almPlaced) {
        // Place in a corner of the room opposite or adjacent
        const ax = rw - almW - 0.5;
        const ay = Math.max(0.5, rh - almL - 0.5);
        furniture.push({
          id: nextId('wardrobe'),
          type: 'wardrobe',
          x: ax,
          y: ay,
          z: 0,
          width: almW,
          length: almL,
          height: 1.8,
          rotation: 0,
          color: '#78350f',
          name: 'Wardrobe'
        });
      }

    } else if (room.type === 'living' || room.type === 'drawing') {
      // Area Rug, Sofa, Coffee Table, and TV Set on opposite walls
      const sW = Math.min(7.5, rw * 0.7);
      const sL = Math.min(6.5, rh * 0.7);

      // Place sofa along back wall if possible, or any clear wall
      let sofaWall: 'back' | 'left' | 'right' | 'front' = 'back';
      if (!blocked.back) sofaWall = 'back';
      else if (!blocked.left) sofaWall = 'left';
      else if (!blocked.right) sofaWall = 'right';
      else sofaWall = 'front';

      let sx = 0.8;
      let sy = 0.8;
      let sRot = 0;

      if (sofaWall === 'back') {
        sx = (rw - sW) / 2;
        sy = 0.8;
        sRot = 0;
      } else if (sofaWall === 'left') {
        sx = 0.8;
        sy = (rh - sL) / 2;
        sRot = 90;
      } else if (sofaWall === 'right') {
        sx = rw - sW - 0.8;
        sy = (rh - sL) / 2;
        sRot = 270;
      } else {
        sx = (rw - sW) / 2;
        sy = rh - sL - 0.8;
        sRot = 180;
      }

      // Add Area Rug
      furniture.push({
        id: nextId('rug'),
        type: 'rug',
        x: sx - 0.5,
        y: sy + 0.5,
        z: 0.01,
        width: sW + 1.0,
        length: sL + 0.2,
        height: 0.02,
        rotation: sRot,
        color: '#fef3c7',
        secondaryColor: '#d97706',
        name: 'Cozy Accent Rug'
      });

      // Add Sofa
      furniture.push({
        id: nextId('sofa'),
        type: 'sofa',
        x: sx,
        y: sy,
        z: 0,
        width: sW,
        length: sL,
        height: 0.9,
        rotation: sRot,
        color: '#064e3b',
        secondaryColor: '#0f766e',
        name: 'Contoured Luxury Sofa'
      });

      // Add Coffee Table centered in front of sofa
      let tx = sx + sW / 2 - 1.5;
      let ty = sy + 4.0;
      if (sofaWall === 'left') {
        tx = sx + 4.0;
        ty = sy + sL / 2 - 1.5;
      } else if (sofaWall === 'right') {
        tx = sx - 3.0;
        ty = sy + sL / 2 - 1.5;
      } else if (sofaWall === 'front') {
        tx = sx + sW / 2 - 1.5;
        ty = sy - 3.0;
      }

      furniture.push({
        id: nextId('coffee_table'),
        type: 'coffee_table',
        x: tx,
        y: ty,
        z: 0,
        width: 3.0,
        length: 1.6,
        height: 0.45,
        rotation: sRot,
        color: 'rgba(186, 230, 253, 0.5)',
        secondaryColor: '#b45309',
        name: 'Glass-Top Coffee Table'
      });

      // Add Wall-Mounted Flat TV opposite the sofa wall
      let tvx = 0;
      let tvy = 0;
      let tvRot = 0;

      if (sofaWall === 'back') {
        tvx = (rw - 5.0) / 2;
        tvy = Math.max(0.1, rh - 0.2);
        tvRot = 180;
      } else if (sofaWall === 'left') {
        tvx = Math.max(0.1, rw - 0.2);
        tvy = (rh - 5.0) / 2;
        tvRot = 270;
      } else if (sofaWall === 'right') {
        tvx = 0.1;
        tvy = (rh - 5.0) / 2;
        tvRot = 90;
      } else {
        tvx = (rw - 5.0) / 2;
        tvy = 0.1;
        tvRot = 0;
      }

      furniture.push({
        id: nextId('tv_set'),
        type: 'tv_set',
        x: tvx,
        y: tvy,
        z: 0.8,
        width: 5.0,
        length: 0.2,
        height: 1.7,
        rotation: tvRot,
        color: '#0f172a',
        name: 'OLED Smart TV'
      });

    } else if (room.type === 'dining') {
      // Center a spacious Dining Table with chairs around it
      const tW = Math.min(5.5, rw * 0.6);
      const tL = Math.min(3.8, rh * 0.55);
      const tx = rw / 2;
      const ty = rh / 2;

      // Dining Table
      furniture.push({
        id: nextId('dining_table'),
        type: 'dining_table',
        x: tx - tW / 2,
        y: ty - tL / 2,
        z: 0,
        width: tW,
        length: tL,
        height: 0.75,
        rotation: 0,
        color: '#b45309',
        secondaryColor: '#78350f',
        name: 'Classic Dining Table'
      });

      // Side chairs
      furniture.push({
        id: nextId('chair'),
        type: 'dining_chair',
        x: tx - tW / 2 - 0.6,
        y: ty - 0.5,
        z: 0,
        width: 1.2,
        length: 1.2,
        height: 0.45,
        rotation: 90,
        color: '#1e293b',
        name: 'Dining Chair Left'
      });

      furniture.push({
        id: nextId('chair'),
        type: 'dining_chair',
        x: tx + tW / 2 + 0.1,
        y: ty - 0.5,
        z: 0,
        width: 1.2,
        length: 1.2,
        height: 0.45,
        rotation: 270,
        color: '#1e293b',
        name: 'Dining Chair Right'
      });

    } else if (room.type === 'kitchen') {
      // L-Shape Kitchen Counters, Stove, Sink, Fridge
      const kx = 0.3;
      const ky = 0.3;
      const kW = Math.min(2.5, rw * 0.45);

      // Kitchen counter
      furniture.push({
        id: nextId('kitchen_counter'),
        type: 'kitchen_counter',
        x: kx,
        y: ky,
        z: 0,
        width: rw - 0.6,
        length: rh - 0.6,
        height: 0.9,
        rotation: 0,
        color: '#0f172a',
        secondaryColor: '#475569',
        name: 'Granite Countertop'
      });

      // Stove
      furniture.push({
        id: nextId('stove'),
        type: 'stove',
        x: kx + rw / 2 - 1.2,
        y: ky + 0.4,
        z: 0.91,
        width: 1.0,
        length: 1.0,
        height: 0.05,
        rotation: 0,
        color: '#ef4444',
        name: 'Cooktop Stove'
      });

      // Sink
      furniture.push({
        id: nextId('sink'),
        type: 'sink',
        x: kx + 0.5,
        y: ky + 0.4,
        z: 0.91,
        width: 1.2,
        length: 0.8,
        height: 0.1,
        rotation: 0,
        color: '#475569',
        secondaryColor: '#cbd5e1',
        name: 'Double Basin Sink'
      });

      // Refrigerator
      furniture.push({
        id: nextId('fridge'),
        type: 'fridge',
        x: kx + rw - 2.5,
        y: ky + rh - 1.8,
        z: 0,
        width: 1.8,
        length: 1.2,
        height: 1.9,
        rotation: 0,
        color: '#94a3b8',
        secondaryColor: '#1e293b',
        name: 'Double-Door Refrigerator'
      });

    } else if (room.type === 'garage') {
      // Sports Car centered
      furniture.push({
        id: nextId('car'),
        type: 'car',
        x: (rw - 5.6) / 2,
        y: (rh - 11.5) / 2,
        z: 0,
        width: 5.6,
        length: 11.5,
        height: 1.4,
        rotation: 0,
        color: '#ef4444',
        secondaryColor: '#0f172a',
        name: 'Sport Sedan Coupe'
      });

    } else if (room.type === 'staircase') {
      // Staircase steps
      furniture.push({
        id: nextId('stairs'),
        type: 'stairs',
        x: 0,
        y: 0,
        z: 0,
        width: rw,
        length: rh,
        height: 1.8,
        rotation: 0,
        color: '#e879f9',
        secondaryColor: '#a21caf',
        name: 'Staircase'
      });

    } else if (room.type === 'bathroom') {
      // Pedestal Sink, modern toilet, and Bathtub
      const bx = 0.4;
      const by = 0.4;

      // Sink
      furniture.push({
        id: nextId('sink'),
        type: 'sink',
        x: bx + 0.8,
        y: by + 0.8,
        z: 0,
        width: 1.0,
        length: 1.0,
        height: 0.9,
        rotation: 0,
        color: '#f8fafc',
        name: 'Vanity Sink'
      });

      // Toilet (placed opposite or side)
      furniture.push({
        id: nextId('toilet'),
        type: 'toilet',
        x: rw - 1.8,
        y: by + 0.8,
        z: 0,
        width: 1.2,
        length: 1.8,
        height: 1.1,
        rotation: 270,
        color: '#f1f5f9',
        secondaryColor: '#cbd5e1',
        name: 'Water Closet Toilet'
      });

      // Bathtub (placed corner)
      if (rw >= 6 && rh >= 6) {
        furniture.push({
          id: nextId('bathtub'),
          type: 'bathtub',
          x: bx + 0.2,
          y: rh - 3.2,
          z: 0,
          width: 2.2,
          length: 2.8,
          height: 0.85,
          rotation: 0,
          color: '#e2e8f0',
          secondaryColor: '#38bdf8',
          name: 'Modern Tub'
        });
      }

    } else if (room.type === 'lawn') {
      // Garden Bench & terracotta plant pots
      furniture.push({
        id: nextId('bench'),
        type: 'bench',
        x: (rw - 3.5) / 2,
        y: rh / 2 - 0.6,
        z: 0,
        width: 3.5,
        length: 1.2,
        height: 0.45,
        rotation: 0,
        color: '#d97706',
        secondaryColor: '#1e293b',
        name: 'Garden Wooden Bench'
      });

      // Corner Plants
      furniture.push({
        id: nextId('plant'),
        type: 'plant',
        x: 0.8,
        y: 0.8,
        z: 0,
        width: 1.0,
        length: 1.0,
        height: 0.9,
        rotation: 0,
        color: '#16a34a',
        name: 'Foliage Plant Pot'
      });

      furniture.push({
        id: nextId('plant'),
        type: 'plant',
        x: rw - 1.8,
        y: 0.8,
        z: 0,
        width: 1.0,
        length: 1.0,
        height: 0.9,
        rotation: 0,
        color: '#16a34a',
        name: 'Foliage Plant Pot'
      });
    }

    return {
      ...room,
      furniture
    };
  });

  return {
    ...layout,
    autoFurnished: true,
    rooms: furnishedRooms,
    floors: layout.floors ? {
      ...layout.floors,
      [layout.activeFloor || 'ground']: {
        ...layout.floors[layout.activeFloor || 'ground'],
        rooms: furnishedRooms
      }
    } : undefined
  };
}

/**
 * Clear all furniture from the layout.
 */
export function clearFurnishLayout(layout: NaqshaLayout): NaqshaLayout {
  const clearedRooms = layout.rooms.map(room => {
    const r = { ...room };
    delete r.furniture;
    return r;
  });

  return {
    ...layout,
    autoFurnished: false,
    rooms: clearedRooms,
    floors: layout.floors ? {
      ...layout.floors,
      [layout.activeFloor || 'ground']: {
        ...layout.floors[layout.activeFloor || 'ground'],
        rooms: clearedRooms
      }
    } : undefined
  };
}
