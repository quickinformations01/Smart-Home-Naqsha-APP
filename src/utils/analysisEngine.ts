import { NaqshaLayout, Room, Door, Window, RoomType } from '../types';

export interface WindowAnalysis {
  windowCount: number;
  totalWindowAreaSqFt: number;
  windowToFloorRatioPct: number;
  hasExternalWall: boolean;
  crossVentilation: boolean;
  airflowPotential: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface SunlightEstimate {
  daylightScore: 'dark' | 'average' | 'good' | 'overexposed';
  orientationExposure: string;
  summaryText: string;
}

export interface CirculationUsability {
  doorClearanceOk: boolean;
  furnitureUsabilityScore: number; // 0 - 100
  issues: string[];
}

export interface RoomDiagnostic {
  roomId: string;
  roomName: string;
  roomType: RoomType;
  dimensions: {
    lengthFt: number;
    widthFt: number;
    areaSqFt: number;
    perimeterFt: number;
    aspectRatio: number;
  };
  status: 'good' | 'acceptable' | 'warning' | 'error'; // Green, Yellow, Red
  aspectRatioCategory: 'square' | 'ideal' | 'elongated' | 'narrow_poor';
  sizeValidation: 'undersized' | 'optimal' | 'oversized' | 'warning';
  recommendedAreaRange: { min: number; max: number };
  windowAnalysis: WindowAnalysis;
  sunlightEstimate: SunlightEstimate;
  circulationUsability: CirculationUsability;
  privacyNotes: string[];
  structuralNotes: string[];
  warnings: string[];
  suggestions: string[];
}

export interface DiagnosticIssue {
  level: 'error' | 'warning' | 'info';
  category: 'Proportions' | 'Ventilation' | 'Circulation' | 'Privacy' | 'Structure' | 'Zoning';
  title: string;
  roomNames?: string[];
  roomId?: string;
  message: string;
  why: string;
  recommendation: string;
}

export interface ActionableOptimization {
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  targetRoomId?: string;
}

export interface LayoutDiagnosticReport {
  overallScore: number; // 0 - 100
  status: 'good' | 'acceptable' | 'needs_improvement';
  categoryScores: {
    proportionsScore: number;  // 0 - 20
    ventilationScore: number;  // 0 - 20
    circulationScore: number;  // 0 - 20
    privacyScore: number;      // 0 - 20
    structuralScore: number;   // 0 - 20
  };
  roomDiagnostics: RoomDiagnostic[];
  globalIssues: DiagnosticIssue[];
  circulationMetrics: {
    corridorAreaSqFt: number;
    circulationRatioPct: number;
    deadEndCount: number;
    doorCollisionRisk: boolean;
  };
  lightingVentilationMetrics: {
    naturalLightCoveragePct: number;
    crossVentilatedRoomsCount: number;
    internalRoomsWithoutOTS: string[];
  };
  privacyMetrics: {
    directBedroomVisibilityFromEntrance: boolean;
    bathOpeningInLiving: boolean;
    kitchenExposedToEntrance: boolean;
  };
  structuralMetrics: {
    longUnsupportedWallsCount: number;
    irregularGeometryCount: number;
    maxBeamSpanFt: number;
  };
  zoningBalance: {
    builtUpAreaSqFt: number;
    openSpaceSqFt: number;
    openSpacePct: number;
    publicZonePct: number;
    privateZonePct: number;
    serviceZonePct: number;
  };
  actionableOptimizations: ActionableOptimization[];
}

// Recommended Room Area Ranges in Sq Ft
const RECOMMENDED_ROOM_SIZES: Record<string, { min: number; max: number; idealMinRatio: number; idealMaxRatio: number }> = {
  bedroom: { min: 110, max: 280, idealMinRatio: 1.15, idealMaxRatio: 2.0 },
  bathroom: { min: 30, max: 80, idealMinRatio: 1.1, idealMaxRatio: 2.2 },
  kitchen: { min: 65, max: 180, idealMinRatio: 1.15, idealMaxRatio: 2.2 },
  living: { min: 150, max: 400, idealMinRatio: 1.15, idealMaxRatio: 2.2 },
  drawing: { min: 130, max: 320, idealMinRatio: 1.15, idealMaxRatio: 2.0 },
  dining: { min: 90, max: 220, idealMinRatio: 1.1, idealMaxRatio: 1.8 },
  garage: { min: 130, max: 450, idealMinRatio: 1.2, idealMaxRatio: 2.5 },
  lawn: { min: 50, max: 1000, idealMinRatio: 1.0, idealMaxRatio: 3.5 },
  staircase: { min: 35, max: 150, idealMinRatio: 1.2, idealMaxRatio: 2.5 },
  corridor: { min: 25, max: 250, idealMinRatio: 1.5, idealMaxRatio: 6.0 },
  other: { min: 30, max: 250, idealMinRatio: 1.0, idealMaxRatio: 2.5 },
};

/**
 * Pure Rule-Based Client-Side Architectural Analysis Engine
 * Evaluates every room and complete layout deterministically using civil & architectural standards.
 */
export function analyzeLayout(layout: NaqshaLayout): LayoutDiagnosticReport {
  const rooms = layout.rooms || [];
  const doors = layout.doors || [];
  const windows = layout.windows || [];
  const facing = layout.facing || 'north';
  const unit = layout.unit || 'ft';

  // Conversion factor to feet if input is in meters
  const toFt = unit === 'm' ? 3.28084 : 1.0;
  const plotWidthFt = layout.width * toFt;
  const plotLengthFt = layout.length * toFt;
  const totalPlotAreaSqFt = plotWidthFt * plotLengthFt;

  const roomDiagnostics: RoomDiagnostic[] = [];
  const globalIssues: DiagnosticIssue[] = [];

  let totalProportionsScore = 20;
  let totalVentilationScore = 20;
  let totalCirculationScore = 20;
  let totalPrivacyScore = 20;
  let totalStructuralScore = 20;

  // 1. INDIVIDUAL ROOM DIAGNOSTICS
  rooms.forEach((room) => {
    const rwFt = room.width * toFt;
    const rhFt = room.height * toFt;
    const lengthFt = Math.max(rwFt, rhFt);
    const widthFt = Math.min(rwFt, rhFt);
    const areaSqFt = rwFt * rhFt;
    const perimeterFt = 2 * (rwFt + rhFt);
    const aspectRatio = widthFt > 0 ? Math.round((lengthFt / widthFt) * 100) / 100 : 1;

    const warnings: string[] = [];
    const suggestions: string[] = [];
    const privacyNotes: string[] = [];
    const structuralNotes: string[] = [];

    // Aspect Ratio Evaluation
    let aspectRatioCategory: 'square' | 'ideal' | 'elongated' | 'narrow_poor' = 'ideal';
    if (aspectRatio < 1.15) {
      aspectRatioCategory = 'square';
      if (room.type === 'bedroom' || room.type === 'living') {
        warnings.push(`${room.name} aspect ratio is ${aspectRatio.toFixed(2)} (almost square). Furniture placement against walls may feel tight.`);
        suggestions.push(`Consider elongating room to 1.2–1.5 ratio for better bed/sofa wall clearance.`);
        totalProportionsScore -= 0.5;
      }
    } else if (aspectRatio >= 1.15 && aspectRatio <= 2.0) {
      aspectRatioCategory = 'ideal';
    } else if (aspectRatio > 2.0 && aspectRatio <= 2.8) {
      aspectRatioCategory = 'elongated';
      warnings.push(`${room.name} is elongated (aspect ratio ${aspectRatio.toFixed(2)}).`);
      suggestions.push(`Reduce length or increase width to bring aspect ratio closer to ideal 1.3–1.8 range.`);
      totalProportionsScore -= 1.0;
    } else {
      aspectRatioCategory = 'narrow_poor';
      warnings.push(`${room.name} is excessively narrow & long (${lengthFt.toFixed(1)} ft × ${widthFt.toFixed(1)} ft, ratio ${aspectRatio.toFixed(2)}).`);
      suggestions.push(`CRITICAL: Increase width by at least 2–3 ft to prevent corridor-like claustrophobic space.`);
      totalProportionsScore -= 2.5;
    }

    // Room Size Validation
    const bounds = RECOMMENDED_ROOM_SIZES[room.type] || RECOMMENDED_ROOM_SIZES.other;
    let sizeValidation: 'undersized' | 'optimal' | 'oversized' | 'warning' = 'optimal';

    if (areaSqFt < bounds.min) {
      sizeValidation = 'undersized';
      warnings.push(`${room.name} area (${Math.round(areaSqFt)} sq ft) is below recommended standard minimum of ${bounds.min} sq ft.`);
      suggestions.push(`Expand room boundary to meet standard architectural minimum of ${bounds.min} sq ft.`);
      totalProportionsScore -= 2.0;
    } else if (areaSqFt > bounds.max) {
      sizeValidation = 'oversized';
      warnings.push(`${room.name} area (${Math.round(areaSqFt)} sq ft) is unusually large compared to standard ${bounds.max} sq ft.`);
      suggestions.push(`Space could be reallocated to enlarge adjacent bathrooms or storage.`);
      totalProportionsScore -= 0.5;
    }

    // Window & Ventilation Analysis
    const roomLeftFt = room.x * toFt;
    const roomRightFt = (room.x + room.width) * toFt;
    const roomTopFt = room.y * toFt;
    const roomBottomFt = (room.y + room.height) * toFt;

    // Check windows associated with or intersecting this room
    const roomWindows = windows.filter((w) => {
      if (w.roomId === room.id) return true;
      const wxFt = w.x * toFt;
      const wyFt = w.y * toFt;
      return wxFt >= roomLeftFt - 1 && wxFt <= roomRightFt + 1 && wyFt >= roomTopFt - 1 && wyFt <= roomBottomFt + 1;
    });

    const windowCount = roomWindows.length;
    // Standard window height = 4.5 ft
    const totalWindowAreaSqFt = roomWindows.reduce((acc, w) => acc + (w.width * toFt * 4.5), 0);
    const windowToFloorRatioPct = areaSqFt > 0 ? Math.round((totalWindowAreaSqFt / areaSqFt) * 1000) / 10 : 0;

    // Check external wall contact
    const margin = 0.5;
    const touchesLeft = Math.abs(roomLeftFt) < margin;
    const touchesRight = Math.abs(roomRightFt - plotWidthFt) < margin;
    const touchesTop = Math.abs(roomTopFt) < margin;
    const touchesBottom = Math.abs(roomBottomFt - plotLengthFt) < margin;
    const hasExternalWall = touchesLeft || touchesRight || touchesTop || touchesBottom;

    // Cross ventilation check
    const externalSidesCount = [touchesLeft, touchesRight, touchesTop, touchesBottom].filter(Boolean).length;
    const crossVentilation = externalSidesCount >= 2 || (windowCount >= 2 && externalSidesCount >= 1);

    let airflowPotential: 'poor' | 'fair' | 'good' | 'excellent' = 'fair';
    if (crossVentilation) airflowPotential = 'excellent';
    else if (windowToFloorRatioPct >= 10 && hasExternalWall) airflowPotential = 'good';
    else if (windowToFloorRatioPct > 0) airflowPotential = 'fair';
    else airflowPotential = 'poor';

    if (room.type !== 'lawn' && room.type !== 'corridor') {
      if (windowCount === 0) {
        warnings.push(`${room.name} has no windows or direct ventilation opening.`);
        suggestions.push(`Add a window or attach an Open to Sky (OTS) ventilation shaft.`);
        totalVentilationScore -= 2.5;
      } else if (windowToFloorRatioPct < 8) {
        warnings.push(`${room.name} window-to-floor ratio (${windowToFloorRatioPct}%) is below 10% recommended standard.`);
        suggestions.push(`Increase window width to improve natural light and air exchange.`);
        totalVentilationScore -= 1.0;
      }
    }

    // Daylight / Sunlight Estimation
    let daylightScore: 'dark' | 'average' | 'good' | 'overexposed' = 'good';
    let orientationExposure = 'Balanced Ambient Light';
    let summaryText = 'Good natural lighting profile.';

    if (windowCount === 0) {
      daylightScore = 'dark';
      orientationExposure = 'Enclosed / Internal';
      summaryText = 'Dark room relying on artificial light.';
    } else {
      if (touchesBottom) {
        // Front wall
        if (facing === 'south') {
          daylightScore = 'good';
          orientationExposure = 'South Facing (Optimal winter warmth & sunlight)';
        } else if (facing === 'west') {
          daylightScore = 'overexposed';
          orientationExposure = 'West Facing (High afternoon solar heat gain)';
          warnings.push(`West-facing windows in ${room.name} may experience intense afternoon heat.`);
          suggestions.push(`Use exterior sunshades or double-glazed windows on west wall.`);
        } else if (facing === 'east') {
          daylightScore = 'good';
          orientationExposure = 'East Facing (Pleasant morning daylight)';
        } else {
          daylightScore = 'average';
          orientationExposure = 'North Facing (Consistent glare-free diffuse light)';
        }
      } else if (touchesTop) {
        // Rear wall
        daylightScore = 'good';
        orientationExposure = 'Rear Exterior Glaze';
      }
    }

    // Circulation & Door Clearance for room
    const roomDoors = doors.filter((d) => d.roomId === room.id || (d.x >= roomLeftFt - 1 && d.x <= roomRightFt + 1 && d.y >= roomTopFt - 1 && d.y <= roomBottomFt + 1));
    const doorClearanceOk = roomDoors.length > 0;
    const circulationIssues: string[] = [];

    if (roomDoors.length === 0 && room.type !== 'lawn') {
      circulationIssues.push(`No door entry detected for ${room.name}.`);
      warnings.push(`Missing entry door for ${room.name}.`);
      totalCirculationScore -= 2.0;
    }

    // Furniture Usability Score
    let furnitureUsabilityScore = 85;
    if (aspectRatioCategory === 'narrow_poor') furnitureUsabilityScore -= 30;
    if (aspectRatioCategory === 'elongated') furnitureUsabilityScore -= 15;
    if (sizeValidation === 'undersized') furnitureUsabilityScore -= 25;
    if (furnitureUsabilityScore < 30) furnitureUsabilityScore = 30;

    // Structural notes
    if (lengthFt > 20) {
      structuralNotes.push(`Long wall length (${lengthFt.toFixed(1)} ft) requires intermediate column or reinforced beam support.`);
    }

    // Status Determination
    let status: 'good' | 'acceptable' | 'warning' | 'error' = 'good';
    if (warnings.length >= 3 || sizeValidation === 'undersized' || aspectRatioCategory === 'narrow_poor' || (windowCount === 0 && room.type === 'bedroom')) {
      status = 'error';
    } else if (warnings.length > 0) {
      status = 'warning';
    } else if (aspectRatioCategory === 'elongated') {
      status = 'acceptable';
    }

    roomDiagnostics.push({
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      dimensions: {
        lengthFt: Math.round(lengthFt * 10) / 10,
        widthFt: Math.round(widthFt * 10) / 10,
        areaSqFt: Math.round(areaSqFt),
        perimeterFt: Math.round(perimeterFt * 10) / 10,
        aspectRatio,
      },
      status,
      aspectRatioCategory,
      sizeValidation,
      recommendedAreaRange: { min: bounds.min, max: bounds.max },
      windowAnalysis: {
        windowCount,
        totalWindowAreaSqFt: Math.round(totalWindowAreaSqFt * 10) / 10,
        windowToFloorRatioPct,
        hasExternalWall,
        crossVentilation,
        airflowPotential,
      },
      sunlightEstimate: {
        daylightScore,
        orientationExposure,
        summaryText,
      },
      circulationUsability: {
        doorClearanceOk,
        furnitureUsabilityScore,
        issues: circulationIssues,
      },
      privacyNotes,
      structuralNotes,
      warnings,
      suggestions,
    });
  });

  // 2. LAYOUT-LEVEL ZONING & PRIVACY AUDIT
  const bedrooms = rooms.filter((r) => r.type === 'bedroom');
  const living = rooms.find((r) => r.type === 'living');
  const kitchen = rooms.find((r) => r.type === 'kitchen');
  const drawing = rooms.find((r) => r.type === 'drawing');
  const garage = rooms.find((r) => r.type === 'garage');
  const bathrooms = rooms.filter((r) => r.type === 'bathroom');

  // Privacy Rule 1: Bedroom directly visible from entrance
  let directBedroomVisibilityFromEntrance = false;
  if (garage || drawing) {
    const entranceY = garage ? garage.y + garage.height : 0;
    const frontBedrooms = bedrooms.filter((b) => b.y * toFt < (plotLengthFt * 0.35));
    if (frontBedrooms.length > 0) {
      directBedroomVisibilityFromEntrance = true;
      totalPrivacyScore -= 4.0;
      globalIssues.push({
        level: 'warning',
        category: 'Privacy',
        title: 'Bedrooms Located in Front Public Zone',
        roomNames: frontBedrooms.map((b) => b.name),
        message: 'Bedrooms are positioned near the front entrance, exposing family private quarters to guests.',
        why: 'In residential architecture, bedrooms should be positioned in the quiet rear zone for privacy and noise control.',
        recommendation: 'Shift bedrooms to the rear half of the plot and keep drawing/living areas in the front.',
      });
    }
  }

  // Privacy Rule 2: Bathroom opening directly into living/dining
  let bathOpeningInLiving = false;
  if (living && bathrooms.length > 0) {
    bathrooms.forEach((bath) => {
      // Check adjacency
      const isAdjacentToLiving =
        Math.abs((bath.x + bath.width) - living.x) < 0.5 ||
        Math.abs(living.x + living.width - bath.x) < 0.5 ||
        Math.abs((bath.y + bath.height) - living.y) < 0.5;
      if (isAdjacentToLiving) {
        bathOpeningInLiving = true;
      }
    });
    if (bathOpeningInLiving) {
      totalPrivacyScore -= 2.5;
      globalIssues.push({
        level: 'warning',
        category: 'Privacy',
        title: 'Bathroom Opening Directly in Living Area',
        message: 'A bathroom shares an immediate wall/doorway with the main living lounge.',
        why: 'Direct bathroom doors facing central family seating cause visual and acoustic discomfort.',
        recommendation: 'Add a small lobby alcove or position bathroom doors off a hallway corridor.',
      });
    }
  }

  // Privacy Rule 3: Kitchen exposed to guest entrance
  let kitchenExposedToEntrance = false;
  if (kitchen && drawing) {
    const isAdjacentToDrawing =
      Math.abs((kitchen.x + kitchen.width) - drawing.x) < 0.5 ||
      Math.abs((drawing.x + drawing.width) - kitchen.x) < 0.5;
    if (isAdjacentToDrawing) {
      kitchenExposedToEntrance = true;
      totalPrivacyScore -= 2.0;
      globalIssues.push({
        level: 'info',
        category: 'Privacy',
        title: 'Kitchen Adjacent to Guest Drawing Room',
        message: 'Kitchen shares a boundary wall with the formal guest drawing room.',
        why: 'Cooking odors and noise can enter formal guest receiving areas.',
        recommendation: 'Provide a buffer pantry or place kitchen closer to the family living zone.',
      });
    }
  }

  // 3. CIRCULATION & DEAD END AUDIT
  const corridors = rooms.filter((r) => r.type === 'corridor');
  const corridorAreaSqFt = corridors.reduce((acc, c) => acc + (c.width * toFt * c.height * toFt), 0);
  const totalBuiltUpAreaSqFt = rooms.reduce((acc, r) => acc + (r.width * toFt * r.height * toFt), 0);
  const circulationRatioPct = totalBuiltUpAreaSqFt > 0 ? Math.round((corridorAreaSqFt / totalBuiltUpAreaSqFt) * 100) : 0;

  let deadEndCount = 0;
  corridors.forEach((c) => {
    const cRatio = (c.width * toFt) / (c.height * toFt);
    if (cRatio > 4.0 || cRatio < 0.25) {
      deadEndCount++;
    }
  });

  if (circulationRatioPct > 22) {
    totalCirculationScore -= 3.0;
    globalIssues.push({
      level: 'warning',
      category: 'Circulation',
      title: 'High Circulation Area Ratio (>22%)',
      message: `Corridors occupy ${circulationRatioPct}% of the house built-up area.`,
      why: 'Excessive passage area wastes valuable plot square footage that could enlarge living rooms or bedrooms.',
      recommendation: 'Consolidate passages into a central open-plan foyer or central TV lounge layout.',
    });
  }

  // 4. STRUCTURAL REALISM AUDIT
  let longUnsupportedWallsCount = 0;
  let maxBeamSpanFt = 0;
  rooms.forEach((r) => {
    const maxDim = Math.max(r.width * toFt, r.height * toFt);
    if (maxDim > maxBeamSpanFt) maxBeamSpanFt = maxDim;
    if (maxDim > 22) {
      longUnsupportedWallsCount++;
    }
  });

  if (longUnsupportedWallsCount > 0) {
    totalStructuralScore -= Math.min(6, longUnsupportedWallsCount * 2);
    globalIssues.push({
      level: 'warning',
      category: 'Structure',
      title: 'Long Unsupported Room Spans (>22 ft)',
      message: `${longUnsupportedWallsCount} room(s) feature clear spans exceeding 22 feet.`,
      why: 'Long spans require heavy RCC beams or intermediate steel pillars, increasing construction costs.',
      recommendation: 'Add load-bearing partition walls or structural columns at 14–18 ft intervals.',
    });
  }

  // 5. ZONING BALANCE & OPEN SPACE
  const openRooms = rooms.filter((r) => r.type === 'lawn' || r.name.toLowerCase().includes('o.t.s') || r.name.toLowerCase().includes('courtyard') || r.name.toLowerCase().includes('shaft'));
  const openSpaceSqFt = openRooms.reduce((acc, r) => acc + (r.width * toFt * r.height * toFt), 0);
  const builtUpAreaSqFt = totalBuiltUpAreaSqFt - openSpaceSqFt;
  const openSpacePct = totalPlotAreaSqFt > 0 ? Math.round((openSpaceSqFt / totalPlotAreaSqFt) * 100) : 0;

  const publicZoneRooms = rooms.filter((r) => r.type === 'drawing' || r.type === 'garage' || r.type === 'lawn');
  const privateZoneRooms = rooms.filter((r) => r.type === 'bedroom' || r.type === 'bathroom');
  const serviceZoneRooms = rooms.filter((r) => r.type === 'kitchen' || r.type === 'staircase' || r.type === 'other');

  const publicAreaSqFt = publicZoneRooms.reduce((acc, r) => acc + (r.width * toFt * r.height * toFt), 0);
  const privateAreaSqFt = privateZoneRooms.reduce((acc, r) => acc + (r.width * toFt * r.height * toFt), 0);
  const serviceAreaSqFt = serviceZoneRooms.reduce((acc, r) => acc + (r.width * toFt * r.height * toFt), 0);

  const publicZonePct = totalBuiltUpAreaSqFt > 0 ? Math.round((publicAreaSqFt / totalBuiltUpAreaSqFt) * 100) : 0;
  const privateZonePct = totalBuiltUpAreaSqFt > 0 ? Math.round((privateAreaSqFt / totalBuiltUpAreaSqFt) * 100) : 0;
  const serviceZonePct = totalBuiltUpAreaSqFt > 0 ? Math.round((serviceAreaSqFt / totalBuiltUpAreaSqFt) * 100) : 0;

  // Clamp sub-scores between 0 and 20
  const clampScore = (s: number) => Math.max(0, Math.min(20, Math.round(s * 10) / 10));

  const proportionsScore = clampScore(totalProportionsScore);
  const ventilationScore = clampScore(totalVentilationScore);
  const circulationScore = clampScore(totalCirculationScore);
  const privacyScore = clampScore(totalPrivacyScore);
  const structuralScore = clampScore(totalStructuralScore);

  const overallScore = Math.round(proportionsScore + ventilationScore + circulationScore + privacyScore + structuralScore);

  let status: 'good' | 'acceptable' | 'needs_improvement' = 'good';
  if (overallScore < 65) status = 'needs_improvement';
  else if (overallScore < 82) status = 'acceptable';

  // Generate Actionable Optimizations list
  const actionableOptimizations: ActionableOptimization[] = [];

  // Filter top issues
  roomDiagnostics.forEach((rd) => {
    if (rd.aspectRatioCategory === 'narrow_poor') {
      actionableOptimizations.push({
        category: 'Proportions',
        title: `Widen Narrow Room: ${rd.roomName}`,
        description: `Room width is only ${rd.dimensions.widthFt} ft with aspect ratio ${rd.dimensions.aspectRatio}. Expand width by 2–3 ft to achieve an ideal 1.3–1.8 ratio.`,
        expectedImpact: 'Improves furniture clearance & layout usability +12 points',
        targetRoomId: rd.roomId,
      });
    }
    if (rd.windowAnalysis.windowCount === 0 && rd.roomType !== 'lawn') {
      actionableOptimizations.push({
        category: 'Ventilation',
        title: `Add Daylight Shaft / Window: ${rd.roomName}`,
        description: `${rd.roomName} lacks direct external windows. Attach a 3'×4' Open-To-Sky (OTS) shaft along the side/rear wall.`,
        expectedImpact: 'Provides natural airflow & daylight compliance +15 points',
        targetRoomId: rd.roomId,
      });
    }
  });

  if (directBedroomVisibilityFromEntrance) {
    actionableOptimizations.push({
      category: 'Privacy',
      title: 'Relocate Bedroom Away From Entrance Zone',
      description: 'Move front bedroom to the quiet rear boundary and place formal drawing/porch in the front.',
      expectedImpact: 'Ensures family privacy and acoustic isolation +10 points',
    });
  }

  if (longUnsupportedWallsCount > 0) {
    actionableOptimizations.push({
      category: 'Structure',
      title: 'Add Intermediate Columns for Clear Spans >22 ft',
      description: `Provide a RCC column or partition wall to break spans over 22 feet.`,
      expectedImpact: 'Reduces slab deflection and structural construction cost +8 points',
    });
  }

  const crossVentilatedRoomsCount = roomDiagnostics.filter((r) => r.windowAnalysis.crossVentilation).length;
  const naturalLightCoveragePct = Math.round(
    (roomDiagnostics.filter((r) => r.windowAnalysis.windowCount > 0).length / Math.max(1, roomDiagnostics.length)) * 100
  );
  const internalRoomsWithoutOTS = roomDiagnostics
    .filter((r) => r.windowAnalysis.windowCount === 0 && r.roomType !== 'lawn')
    .map((r) => r.roomName);

  return {
    overallScore,
    status,
    categoryScores: {
      proportionsScore,
      ventilationScore,
      circulationScore,
      privacyScore,
      structuralScore,
    },
    roomDiagnostics,
    globalIssues,
    circulationMetrics: {
      corridorAreaSqFt: Math.round(corridorAreaSqFt),
      circulationRatioPct,
      deadEndCount,
      doorCollisionRisk: false,
    },
    lightingVentilationMetrics: {
      naturalLightCoveragePct,
      crossVentilatedRoomsCount,
      internalRoomsWithoutOTS,
    },
    privacyMetrics: {
      directBedroomVisibilityFromEntrance,
      bathOpeningInLiving,
      kitchenExposedToEntrance,
    },
    structuralMetrics: {
      longUnsupportedWallsCount,
      irregularGeometryCount: 0,
      maxBeamSpanFt: Math.round(maxBeamSpanFt * 10) / 10,
    },
    zoningBalance: {
      builtUpAreaSqFt: Math.round(builtUpAreaSqFt),
      openSpaceSqFt: Math.round(openSpaceSqFt),
      openSpacePct,
      publicZonePct,
      privateZonePct,
      serviceZonePct,
    },
    actionableOptimizations,
  };
}
