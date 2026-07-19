import { NaqshaLayout, Room } from '../types';

export interface MaterialRates {
  cement: number;           // PKR per Bag (50kg)
  steel: number;            // PKR per Ton
  bricks: number;           // PKR per 1000 bricks
  sand: number;             // PKR per Cubic Foot (CFT)
  crush: number;            // PKR per Cubic Foot (CFT)
  bindingWire: number;      // PKR per kg
  shuttering: number;       // PKR per sq ft (for rental/fixing)
  transportation: number;   // PKR total flat rate or per trip
  water: number;            // PKR flat rate for construction water
  misc: number;             // PKR flat budget
  labourRate: number;       // PKR per Sq Ft of covered area
}

export interface EstimatorInputs {
  wallThicknessExt: 4.5 | 9 | 13.5 | number;  // inches
  wallThicknessInt: 4.5 | 9 | 13.5 | number;  // inches
  wallHeight: number;       // feet
  foundationType: 'strip' | 'pad' | 'raft';
  foundationDepth: number;  // feet
  columnQuantity: number;   // auto-calculated but overridable
  columnSizeX: number;      // inches (e.g., 12)
  columnSizeY: number;      // inches (e.g., 12)
  beamSizeX: number;        // inches
  beamSizeY: number;        // inches
  roofType: 'rcc' | 'rb';   // RCC slab or Reinforced Brick
  slabThickness: number;    // inches (usually 5 or 6)
  hasStaircase: boolean;
  parapetHeight: number;    // feet
  parapetThickness: number; // inches
  hasWaterTank: boolean;
  waterTankCapacity: number; // gallons
  porchArea: number;        // sq ft
  terraceArea: number;      // sq ft
}

export interface CostBreakdownItem {
  stage: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitRate: number;
  materialCost: number;
  labourCost: number;
  totalCost: number;
}

export interface StageSummary {
  stageName: string;
  materialCost: number;
  labourCost: number;
  totalCost: number;
  items: CostBreakdownItem[];
}

export interface FloorWiseBreakdown {
  floorKey: 'ground' | 'first' | 'second' | 'logistics';
  floorName: string;
  coveredAreaSqFt: number;
  materialCost: number;
  labourCost: number;
  totalCost: number;
  materialBreakdown: {
    cementBags: number;
    steelTons: number;
    bricksCount: number;
    sandCft: number;
    crushCft: number;
    bindingWireKg: number;
    shutteringSqFt: number;
  };
}

export interface GreyStructureEstimate {
  coveredAreaSqFt: number;
  floorsCount: number;
  materialBreakdown: {
    cementBags: number;
    steelTons: number;
    bricksCount: number;
    sandCft: number;
    crushCft: number;
    bindingWireKg: number;
    shutteringSqFt: number;
  };
  stages: StageSummary[];
  totalMaterialCost: number;
  totalLabourCost: number;
  grandTotal: number;
  costPerSqFt: number;
  floorWiseBreakdown: FloorWiseBreakdown[];
}

// Standard Pakistan Market Rates (July 2026 Defaults)
export const DEFAULT_PAK_RATES: MaterialRates = {
  cement: 1450,       // PKR per bag
  steel: 260000,      // PKR per ton (60 Grade)
  bricks: 18,         // PKR per single brick (18,000 per 1000)
  sand: 65,           // PKR per CFT (Lawrencepur/Ravi sand average)
  crush: 110,         // PKR per CFT (Sargodha/Margalla average)
  bindingWire: 320,   // PKR per kg
  shuttering: 95,     // PKR per sq ft
  transportation: 45000,
  water: 35000,
  misc: 60000,
  labourRate: 480,    // PKR per sq ft of covered area (grey structure)
};

export const DEFAULT_ESTIMATOR_INPUTS: EstimatorInputs = {
  wallThicknessExt: 9,
  wallThicknessInt: 4.5,
  wallHeight: 10.5,
  foundationType: 'strip',
  foundationDepth: 4.5,
  columnQuantity: 12,
  columnSizeX: 12,
  columnSizeY: 12,
  beamSizeX: 9,
  beamSizeY: 15,
  roofType: 'rcc',
  slabThickness: 5.5,
  hasStaircase: true,
  parapetHeight: 3.5,
  parapetThickness: 4.5,
  hasWaterTank: true,
  waterTankCapacity: 2000,
  porchArea: 180,
  terraceArea: 150,
};

/**
 * Calculates physical wall run lengths from Naqsha rooms layout
 */
export function calculatePhysicalWallLengths(layout: NaqshaLayout): {
  externalWallLength: number;
  internalWallLength: number;
} {
  // Aggregate rooms across all floors to analyze structure
  let totalExt = 0;
  let totalInt = 0;

  const floors = layout.floors ? Object.keys(layout.floors) : ['ground'];

  floors.forEach((floorKey) => {
    const rooms = floorKey === 'ground'
      ? (layout.floors?.ground?.rooms || layout.rooms || [])
      : (layout.floors?.[floorKey]?.rooms || []);

    const nonLawnRooms = rooms.filter(r => r.type !== 'lawn');
    if (nonLawnRooms.length === 0) return;

    // Outer bounding perimeter of the building is external walls
    // Inner partitions are internal walls
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nonLawnRooms.forEach((r) => {
      if (r.x < minX) minX = r.x;
      if (r.x + r.width > maxX) maxX = r.x + r.width;
      if (r.y < minY) minY = r.y;
      if (r.y + r.height > maxY) maxY = r.y + r.height;
    });

    const floorWidth = maxX - minX;
    const floorHeight = maxY - minY;

    // External wall running length is outer bounding box perimeter
    const extLength = 2 * (floorWidth + floorHeight);
    totalExt += extLength;

    // Internal partition length: sum of all room perimeters minus external walls, divided by 2 (since shared)
    let sumPerimeters = 0;
    nonLawnRooms.forEach((r) => {
      sumPerimeters += 2 * (r.width + r.height);
    });

    const intLength = Math.max(0, (sumPerimeters - extLength) / 2);
    totalInt += intLength;
  });

  // If units are in meters, convert to feet (since Pak estimators strictly use CFT / CFT / SFT / Feet)
  const isMeters = layout.unit === 'm';
  const toFt = isMeters ? 3.28084 : 1;

  return {
    externalWallLength: totalExt * toFt,
    internalWallLength: totalInt * toFt,
  };
}

/**
 * Calculates wall run lengths for a single floor's rooms list
 */
export function calculateFloorWallLengths(rooms: Room[], unit: 'ft' | 'm'): {
  externalWallLength: number;
  internalWallLength: number;
} {
  const nonLawnRooms = rooms.filter(r => r.type !== 'lawn');
  if (nonLawnRooms.length === 0) {
    return { externalWallLength: 0, internalWallLength: 0 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nonLawnRooms.forEach((r) => {
    if (r.x < minX) minX = r.x;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
    if (r.y < minY) minY = r.y;
    if (r.y + r.height > maxY) maxY = r.y + r.height;
  });

  const floorWidth = maxX - minX;
  const floorHeight = maxY - minY;

  const extLength = 2 * (floorWidth + floorHeight);
  
  let sumPerimeters = 0;
  nonLawnRooms.forEach((r) => {
    sumPerimeters += 2 * (r.width + r.height);
  });

  const intLength = Math.max(0, (sumPerimeters - extLength) / 2);

  const isMeters = unit === 'm';
  const toFt = isMeters ? 3.28084 : 1;

  return {
    externalWallLength: extLength * toFt,
    internalWallLength: intLength * toFt,
  };
}

interface CostItem {
  floorKey: 'ground' | 'first' | 'second' | 'logistics';
  stageIndex: number; // 1 to 8
  stageName: string;
  subStageName: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitRate: number;
  materialCost: number;
  labourCost: number;
  cementBags: number;
  steelTons: number;
  bricksCount: number;
  sandCft: number;
  crushCft: number;
  bindingWireKg: number;
  shutteringSqFt: number;
}

/**
 * Main Dynamic Calculation Engine
 */
export function calculatePakistanGreyStructureCost(
  layout: NaqshaLayout,
  userInputs: EstimatorInputs,
  rates: MaterialRates
): GreyStructureEstimate {
  const isMeters = layout.unit === 'm';
  const floorsKeys = layout.floors ? (Object.keys(layout.floors) as ('ground' | 'first' | 'second')[]) : ['ground' as const];
  const floorsCount = floorsKeys.length;

  // We will build a unified list of cost items, and then aggregate them
  const itemsList: CostItem[] = [];

  floorsKeys.forEach((floorKey) => {
    const floorName = floorKey === 'ground' ? 'Ground Floor' : floorKey === 'first' ? 'First Floor' : 'Second Floor';
    const rooms = floorKey === 'ground'
      ? (layout.floors?.ground?.rooms || layout.rooms || [])
      : (layout.floors?.[floorKey]?.rooms || []);
    
    const builtRooms = rooms.filter(r => r.type !== 'lawn');
    let floorCoveredAreaSqFt = 0;
    builtRooms.forEach((r) => {
      floorCoveredAreaSqFt += r.width * r.height;
    });
    if (isMeters) {
      floorCoveredAreaSqFt = floorCoveredAreaSqFt * 10.7639;
    }
    if (floorCoveredAreaSqFt <= 0) {
      floorCoveredAreaSqFt = layout.width * layout.length;
      if (isMeters) floorCoveredAreaSqFt = floorCoveredAreaSqFt * 10.7639;
    }

    const { externalWallLength: extWallLength, internalWallLength: intWallLength } = calculateFloorWallLengths(rooms, layout.unit);
    const wallRunTotal = extWallLength + intWallLength;

    // ================= 1. EXCAVATION & PCC FOUNDATION (GF only) =================
    if (floorKey === 'ground') {
      const excavationWidth = 3.0;
      const excavationDepth = userInputs.foundationDepth;
      const excavationVolume = wallRunTotal * excavationWidth * excavationDepth;
      const excavationLabourCost = Math.round(excavationVolume * 15);

      itemsList.push({
        floorKey,
        stageIndex: 1,
        stageName: '1. Excavation & PCC Foundation',
        subStageName: 'Excavation',
        materialName: 'Soil Excavation & Backfilling',
        quantity: Math.round(excavationVolume),
        unit: 'CFT',
        unitRate: 15,
        materialCost: 0,
        labourCost: excavationLabourCost,
        cementBags: 0,
        steelTons: 0,
        bricksCount: 0,
        sandCft: 0,
        crushCft: 0,
        bindingWireKg: 0,
        shutteringSqFt: 0
      });

      const pccThickness = 0.5;
      const pccVolume = wallRunTotal * excavationWidth * pccThickness;
      const pccDryVolume = pccVolume * 1.54;
      const pccCementBags = Math.ceil((1 / 13) * pccDryVolume / 1.25);
      const pccSandCft = Math.round((4 / 13) * pccDryVolume);
      const pccCrushCft = Math.round((8 / 13) * pccDryVolume);
      const pccMaterialCost = (pccCementBags * rates.cement) + (pccSandCft * rates.sand) + (pccCrushCft * rates.crush);
      const pccLabourCost = Math.round(pccVolume * 25);

      itemsList.push({
        floorKey,
        stageIndex: 1,
        stageName: '1. Excavation & PCC Foundation',
        subStageName: 'PCC Foundation',
        materialName: 'Lean Concrete (1:4:8 Mix)',
        quantity: Math.round(pccVolume),
        unit: 'CFT',
        unitRate: rates.cement,
        materialCost: pccMaterialCost,
        labourCost: pccLabourCost,
        cementBags: pccCementBags,
        steelTons: 0,
        bricksCount: 0,
        sandCft: pccSandCft,
        crushCft: pccCrushCft,
        bindingWireKg: 0,
        shutteringSqFt: 0
      });
    }

    // ================= 2. FOUNDATION FOOTING, PLINTH BEAM & DPC (GF only) =================
    if (floorKey === 'ground') {
      const footingHeight = 3.0;
      const footingAvgThickness = 1.125;
      const footingMasonryVolume = wallRunTotal * footingAvgThickness * footingHeight;
      const foundationBricks = Math.ceil(footingMasonryVolume * 13.5);
      const footingMortarDry = footingMasonryVolume * 0.3 * 1.54;
      const footingCement = Math.ceil((1 / 6) * footingMortarDry / 1.25);
      const footingSand = Math.round((5 / 6) * footingMortarDry);
      const footingMatCost = (foundationBricks * rates.bricks) + (footingCement * rates.cement) + (footingSand * rates.sand);
      const footingLabourCost = Math.round(footingMasonryVolume * 35);

      itemsList.push({
        floorKey,
        stageIndex: 2,
        stageName: '2. Foundation Footings, Plinth Beam & DPC',
        subStageName: 'Footing Masonry',
        materialName: 'Foundation Bricks & Mortar',
        quantity: foundationBricks,
        unit: 'Bricks',
        unitRate: rates.bricks,
        materialCost: footingMatCost,
        labourCost: footingLabourCost,
        cementBags: footingCement,
        steelTons: 0,
        bricksCount: foundationBricks,
        sandCft: footingSand,
        crushCft: 0,
        bindingWireKg: 0,
        shutteringSqFt: 0
      });

      const plinthBeamVol = wallRunTotal * 0.75 * 1.0;
      const plinthDryVol = plinthBeamVol * 1.54;
      const plinthCement = Math.ceil((1 / 7) * plinthDryVol / 1.25);
      const plinthSand = Math.round((2 / 7) * plinthDryVol);
      const plinthCrush = Math.round((4 / 7) * plinthDryVol);
      const plinthSteelKg = Math.round(plinthBeamVol * 2.66);
      const plinthSteelTons = plinthSteelKg / 1000;
      const plinthMatCost = (plinthCement * rates.cement) + (plinthSand * rates.sand) + (plinthCrush * rates.crush) + (plinthSteelTons * rates.steel);
      const plinthLabourCost = Math.round(plinthBeamVol * 65);

      const dpcArea = wallRunTotal * 0.75;
      const dpcVolume = dpcArea * (1.5 / 12);
      const dpcDry = dpcVolume * 1.54;
      const dpcCement = Math.ceil((1 / 3) * dpcDry / 1.25);
      const dpcSand = Math.round((2 / 3) * dpcDry);
      const dpcMatCost = (dpcCement * rates.cement) + (dpcSand * rates.sand);

      itemsList.push({
        floorKey,
        stageIndex: 2,
        stageName: '2. Foundation Footings, Plinth Beam & DPC',
        subStageName: 'Plinth Beam & DPC',
        materialName: 'RCC Plinth Beam & DPC Membrane',
        quantity: Math.round(plinthBeamVol),
        unit: 'CFT Concrete',
        unitRate: rates.cement,
        materialCost: plinthMatCost + dpcMatCost,
        labourCost: plinthLabourCost,
        cementBags: plinthCement + dpcCement,
        steelTons: plinthSteelTons,
        bricksCount: 0,
        sandCft: plinthSand + dpcSand,
        crushCft: plinthCrush,
        bindingWireKg: Math.round(plinthSteelTons * 10),
        shutteringSqFt: 0
      });
    }

    // ================= 3. COLUMN & BEAM SKELETON (FRAMING - on each floor) =================
    const colAreaSqFt = (userInputs.columnSizeX * userInputs.columnSizeY) / 144;
    const columnsVolume = userInputs.columnQuantity * colAreaSqFt * userInputs.wallHeight;
    const colDryVol = columnsVolume * 1.54;
    const colCement = Math.ceil((1 / 7) * colDryVol / 1.25);
    const colSand = Math.round((2 / 7) * colDryVol);
    const colCrush = Math.round((4 / 7) * colDryVol);
    const colSteelKg = Math.round(columnsVolume * 4.4);
    const colSteelTons = colSteelKg / 1000;
    const colMatCost = (colCement * rates.cement) + (colSand * rates.sand) + (colCrush * rates.crush) + (colSteelTons * rates.steel);
    const colLabour = Math.round(columnsVolume * 95);

    itemsList.push({
      floorKey,
      stageIndex: 3,
      stageName: '3. Column & Beam Skeleton (Framing)',
      subStageName: 'RCC Columns',
      materialName: `${floorName} Columns (1:2:4 RCC & Steel)`,
      quantity: Math.round(columnsVolume),
      unit: 'CFT Concrete',
      unitRate: rates.cement,
      materialCost: colMatCost,
      labourCost: colLabour,
      cementBags: colCement,
      steelTons: colSteelTons,
      bricksCount: 0,
      sandCft: colSand,
      crushCft: colCrush,
      bindingWireKg: Math.round(colSteelTons * 10),
      shutteringSqFt: 0
    });

    const beamVolume = wallRunTotal * ((userInputs.beamSizeX * userInputs.beamSizeY) / 144);
    const beamDryVol = beamVolume * 1.54;
    const beamCement = Math.ceil((1 / 7) * beamDryVol / 1.25);
    const beamSand = Math.round((2 / 7) * beamDryVol);
    const beamCrush = Math.round((4 / 7) * beamDryVol);
    const beamSteelKg = Math.round(beamVolume * 3.3);
    const beamSteelTons = beamSteelKg / 1000;
    const beamMatCost = (beamCement * rates.cement) + (beamSand * rates.sand) + (beamCrush * rates.crush) + (beamSteelTons * rates.steel);
    const beamLabour = Math.round(beamVolume * 95);

    itemsList.push({
      floorKey,
      stageIndex: 3,
      stageName: '3. Column & Beam Skeleton (Framing)',
      subStageName: 'RCC Beams',
      materialName: `${floorName} Slab Beams (RCC Frame)`,
      quantity: Math.round(beamVolume),
      unit: 'CFT Concrete',
      unitRate: rates.cement,
      materialCost: beamMatCost,
      labourCost: beamLabour,
      cementBags: beamCement,
      steelTons: beamSteelTons,
      bricksCount: 0,
      sandCft: beamSand,
      crushCft: beamCrush,
      bindingWireKg: Math.round(beamSteelTons * 10),
      shutteringSqFt: 0
    });

    // ================= 4. BRICK MASONRY & LINTELS (on each floor) =================
    const extWallArea = extWallLength * userInputs.wallHeight;
    const intWallArea = intWallLength * userInputs.wallHeight;
    const netExtWallArea = extWallArea * 0.88;
    const netIntWallArea = intWallArea * 0.88;
    const extWallVol = netExtWallArea * (userInputs.wallThicknessExt / 12);
    const intWallVol = netIntWallArea * (userInputs.wallThicknessInt / 12);
    const totalMasonryVol = extWallVol + intWallVol;

    const superstructureBricks = Math.ceil(totalMasonryVol * 13.5);
    const superstructureMortarDry = totalMasonryVol * 0.3 * 1.54;
    const superstructureCement = Math.ceil((1 / 6) * superstructureMortarDry / 1.25);
    const superstructureSand = Math.round((5 / 6) * superstructureMortarDry);
    const superstructureMatCost = (superstructureBricks * rates.bricks) + (superstructureCement * rates.cement) + (superstructureSand * rates.sand);
    const superstructureLabour = Math.round(totalMasonryVol * 45);

    itemsList.push({
      floorKey,
      stageIndex: 4,
      stageName: '4. Brick Masonry & Lintels',
      subStageName: 'Superstructure Bricks',
      materialName: `${floorName} Red Clay Bricks`,
      quantity: superstructureBricks,
      unit: 'Bricks',
      unitRate: rates.bricks,
      materialCost: superstructureMatCost,
      labourCost: superstructureLabour,
      cementBags: superstructureCement,
      steelTons: 0,
      bricksCount: superstructureBricks,
      sandCft: superstructureSand,
      crushCft: 0,
      bindingWireKg: 0,
      shutteringSqFt: 0
    });

    const lintelVol = 80;
    const lintelDry = lintelVol * 1.54;
    const lintelCement = Math.ceil((1 / 7) * lintelDry / 1.25);
    const lintelSand = Math.round((2 / 7) * lintelDry);
    const lintelCrush = Math.round((4 / 7) * lintelDry);
    const lintelSteel = Math.round(lintelVol * 2.5);
    const lintelSteelTons = lintelSteel / 1000;
    const lintelMatCost = (lintelCement * rates.cement) + (lintelSand * rates.sand) + (lintelCrush * rates.crush) + (lintelSteelTons * rates.steel);
    const lintelLabour = Math.round(lintelVol * 75);

    itemsList.push({
      floorKey,
      stageIndex: 4,
      stageName: '4. Brick Masonry & Lintels',
      subStageName: 'Lintel Beams',
      materialName: `${floorName} Lintel Concrete Support`,
      quantity: Math.round(lintelVol),
      unit: 'CFT Concrete',
      unitRate: rates.cement,
      materialCost: lintelMatCost,
      labourCost: lintelLabour,
      cementBags: lintelCement,
      steelTons: lintelSteelTons,
      bricksCount: 0,
      sandCft: lintelSand,
      crushCft: lintelCrush,
      bindingWireKg: Math.round(lintelSteelTons * 10),
      shutteringSqFt: 0
    });

    // ================= 5. ROOF SLAB CASTING & SHUTTERING (on each floor) =================
    const roofSlabVol = floorCoveredAreaSqFt * (userInputs.slabThickness / 12);
    let slabCement = 0;
    let slabSand = 0;
    let slabCrush = 0;
    let slabSteelKg = 0;
    let slabBricks = 0;

    if (userInputs.roofType === 'rcc') {
      const dryVol = roofSlabVol * 1.54;
      slabCement = Math.ceil((1 / 7) * dryVol / 1.25);
      slabSand = Math.round((2 / 7) * dryVol);
      slabCrush = Math.round((4 / 7) * dryVol);
      slabSteelKg = Math.round(roofSlabVol * 2.2);
    } else {
      const dryVol = (roofSlabVol * 0.5) * 1.54;
      slabCement = Math.ceil((1 / 7) * dryVol / 1.25);
      slabSand = Math.round((2 / 7) * dryVol);
      slabCrush = Math.round((4 / 7) * dryVol);
      slabSteelKg = Math.round(roofSlabVol * 1.2);
      slabBricks = Math.ceil(roofSlabVol * 0.5 * 13.5);
    }

    const slabSteelTons = slabSteelKg / 1000;
    const slabMatCost = (slabCement * rates.cement) + (slabSand * rates.sand) + (slabCrush * rates.crush) + (slabSteelTons * rates.steel) + (slabBricks * rates.bricks);
    const slabLabour = Math.round(roofSlabVol * 80);

    itemsList.push({
      floorKey,
      stageIndex: 5,
      stageName: '5. Roof Slab Casting & Shuttering',
      subStageName: 'Slab Concrete',
      materialName: userInputs.roofType === 'rcc' ? `${floorName} RCC Slab casting` : `${floorName} RB Slab (Bricks & Concrete)`,
      quantity: Math.round(roofSlabVol),
      unit: 'CFT Concrete',
      unitRate: rates.cement,
      materialCost: slabMatCost,
      labourCost: slabLabour,
      cementBags: slabCement,
      steelTons: slabSteelTons,
      bricksCount: slabBricks,
      sandCft: slabSand,
      crushCft: slabCrush,
      bindingWireKg: Math.round(slabSteelTons * 10),
      shutteringSqFt: 0
    });

    const shutteringSqFt = floorCoveredAreaSqFt;
    const shutteringRentalCost = shutteringSqFt * rates.shuttering;

    itemsList.push({
      floorKey,
      stageIndex: 5,
      stageName: '5. Roof Slab Casting & Shuttering',
      subStageName: 'Slab Shuttering',
      materialName: `${floorName} Steel/Wood Shuttering Rental`,
      quantity: Math.round(shutteringSqFt),
      unit: 'SFT',
      unitRate: rates.shuttering,
      materialCost: shutteringRentalCost,
      labourCost: 0,
      cementBags: 0,
      steelTons: 0,
      bricksCount: 0,
      sandCft: 0,
      crushCft: 0,
      bindingWireKg: 0,
      shutteringSqFt: shutteringSqFt
    });

    // ================= 6. STAIRCASE, PARAPET & WATER TANK (top floor only) =================
    const isTopFloor = floorKey === floorsKeys[floorsKeys.length - 1];
    if (isTopFloor) {
      if (userInputs.hasStaircase) {
        const staircaseCostMat = (25 * rates.cement) + (60 * rates.sand) + (120 * rates.crush) + (0.28 * rates.steel);
        const staircaseCostLab = 45000;

        itemsList.push({
          floorKey,
          stageIndex: 6,
          stageName: '6. Staircase, Parapet & Water Tank',
          subStageName: 'Staircase',
          materialName: 'Concrete Staircase steps & Steel',
          quantity: 1,
          unit: 'Job',
          unitRate: staircaseCostMat,
          materialCost: staircaseCostMat,
          labourCost: staircaseCostLab,
          cementBags: 25,
          steelTons: 0.28,
          bricksCount: 0,
          sandCft: 60,
          crushCft: 120,
          bindingWireKg: Math.round(0.28 * 10),
          shutteringSqFt: 0
        });
      }

      const parapetArea = extWallLength * userInputs.parapetHeight;
      const parapetVol = parapetArea * (userInputs.parapetThickness / 12);
      const parapetBricks = Math.ceil(parapetVol * 13.5);
      const parapetMortar = parapetVol * 0.3 * 1.54;
      const parapetCement = Math.ceil((1 / 6) * parapetMortar / 1.25);
      const parapetSand = Math.round((5 / 6) * parapetMortar);
      const parapetCostMat = (parapetBricks * rates.bricks) + (parapetCement * rates.cement) + (parapetSand * rates.sand);
      const parapetCostLab = Math.round(parapetVol * 45);

      itemsList.push({
        floorKey,
        stageIndex: 6,
        stageName: '6. Staircase, Parapet & Water Tank',
        subStageName: 'Parapet Wall',
        materialName: 'Parapet Boundary Masonry',
        quantity: parapetBricks,
        unit: 'Bricks',
        unitRate: rates.bricks,
        materialCost: parapetCostMat,
        labourCost: parapetCostLab,
        cementBags: parapetCement,
        steelTons: 0,
        bricksCount: parapetBricks,
        sandCft: parapetSand,
        crushCft: 0,
        bindingWireKg: 0,
        shutteringSqFt: 0
      });

      if (userInputs.hasWaterTank) {
        const tankScale = userInputs.waterTankCapacity / 2000;
        const tCement = Math.ceil(35 * tankScale);
        const tSand = Math.round(90 * tankScale);
        const tCrush = Math.round(180 * tankScale);
        const tSteelTons = 0.32 * tankScale;
        const tankCostMat = (tCement * rates.cement) + (tSand * rates.sand) + (tCrush * rates.crush) + (tSteelTons * rates.steel);
        const tankCostLab = Math.round(25000 * tankScale);

        itemsList.push({
          floorKey,
          stageIndex: 6,
          stageName: '6. Staircase, Parapet & Water Tank',
          subStageName: 'Water Tank',
          materialName: 'Overhead RCC Water Tank',
          quantity: userInputs.waterTankCapacity,
          unit: 'Gallons',
          unitRate: Math.round(tankCostMat / userInputs.waterTankCapacity),
          materialCost: tankCostMat,
          labourCost: tankCostLab,
          cementBags: tCement,
          steelTons: tSteelTons,
          bricksCount: 0,
          sandCft: tSand,
          crushCft: tCrush,
          bindingWireKg: Math.round(tSteelTons * 10),
          shutteringSqFt: 0
        });
      }
    }

    // ================= 8. GREY STRUCTURE GENERAL LABOUR CONTRACT (allocated floor-wise) =================
    const floorLabourContractCost = Math.round(floorCoveredAreaSqFt * rates.labourRate);

    itemsList.push({
      floorKey,
      stageIndex: 8,
      stageName: '8. Grey Structure General Labour Contract',
      subStageName: 'Labour Contract',
      materialName: `${floorName} General Labour Contract`,
      quantity: Math.round(floorCoveredAreaSqFt),
      unit: 'SFT Covered Area',
      unitRate: rates.labourRate,
      materialCost: 0,
      labourCost: floorLabourContractCost,
      cementBags: 0,
      steelTons: 0,
      bricksCount: 0,
      sandCft: 0,
      crushCft: 0,
      bindingWireKg: 0,
      shutteringSqFt: 0
    });
  });

  // ================= 7. TRANSPORT, CARTAGE & SITE UTILITIES (Shared project-wide) =================
  itemsList.push({
    floorKey: 'logistics',
    stageIndex: 7,
    stageName: '7. Transport, Cartage & Site Utilities',
    subStageName: 'Logistics',
    materialName: 'Transportation & Cartage',
    quantity: 1,
    unit: 'Flat',
    unitRate: rates.transportation,
    materialCost: rates.transportation,
    labourCost: 0,
    cementBags: 0,
    steelTons: 0,
    bricksCount: 0,
    sandCft: 0,
    crushCft: 0,
    bindingWireKg: 0,
    shutteringSqFt: 0
  });

  itemsList.push({
    floorKey: 'logistics',
    stageIndex: 7,
    stageName: '7. Transport, Cartage & Site Utilities',
    subStageName: 'Logistics',
    materialName: 'Construction Water Supply',
    quantity: 1,
    unit: 'Flat',
    unitRate: rates.water,
    materialCost: rates.water,
    labourCost: 0,
    cementBags: 0,
    steelTons: 0,
    bricksCount: 0,
    sandCft: 0,
    crushCft: 0,
    bindingWireKg: 0,
    shutteringSqFt: 0
  });

  itemsList.push({
    floorKey: 'logistics',
    stageIndex: 7,
    stageName: '7. Transport, Cartage & Site Utilities',
    subStageName: 'Logistics',
    materialName: 'Miscellaneous Site Cost',
    quantity: 1,
    unit: 'Flat',
    unitRate: rates.misc,
    materialCost: rates.misc,
    labourCost: 0,
    cementBags: 0,
    steelTons: 0,
    bricksCount: 0,
    sandCft: 0,
    crushCft: 0,
    bindingWireKg: 0,
    shutteringSqFt: 0
  });


  // ================= AGGREGATION SYSTEM =================
  // 1. Calculate combined Covered Area (from Ground, First, Second floors)
  let totalCoveredAreaSqFt = 0;
  floorsKeys.forEach((floorKey) => {
    const rooms = floorKey === 'ground'
      ? (layout.floors?.ground?.rooms || layout.rooms || [])
      : (layout.floors?.[floorKey]?.rooms || []);
    const builtRooms = rooms.filter(r => r.type !== 'lawn');
    let floorArea = 0;
    builtRooms.forEach((r) => {
      floorArea += r.width * r.height;
    });
    if (isMeters) {
      floorArea = floorArea * 10.7639;
    }
    if (floorArea <= 0) {
      floorArea = layout.width * layout.length;
      if (isMeters) floorArea = floorArea * 10.7639;
    }
    totalCoveredAreaSqFt += floorArea;
  });

  // 2. Aggregate Materials project-wide
  let totalCementBags = 0;
  let totalSteelTons = 0;
  let totalBricksCount = 0;
  let totalSandCft = 0;
  let totalCrushCft = 0;
  let totalShutteringSqFt = 0;

  itemsList.forEach((item) => {
    totalCementBags += item.cementBags;
    totalSteelTons += item.steelTons;
    totalBricksCount += item.bricksCount;
    totalSandCft += item.sandCft;
    totalCrushCft += item.crushCft;
    totalShutteringSqFt += item.shutteringSqFt;
  });

  // Binding wire: normally 10 kg per ton of steel
  const totalBindingWireKg = Math.round(totalSteelTons * 10);

  // 3. Build Stages Breakdown array (Stages 1 through 8)
  const stages: StageSummary[] = [];
  const stageIndexes = [1, 2, 3, 4, 5, 6, 7, 8];
  
  stageIndexes.forEach((idx) => {
    const stageItems = itemsList.filter(item => item.stageIndex === idx);
    if (stageItems.length === 0) return;

    const stageName = stageItems[0].stageName;
    const items: CostBreakdownItem[] = stageItems.map(item => ({
      stage: item.subStageName,
      materialName: item.materialName,
      quantity: item.quantity,
      unit: item.unit,
      unitRate: item.unitRate,
      materialCost: item.materialCost,
      labourCost: item.labourCost,
      totalCost: item.materialCost + item.labourCost
    }));

    const materialCost = items.reduce((sum, item) => sum + item.materialCost, 0);
    const labourCost = items.reduce((sum, item) => sum + item.labourCost, 0);

    stages.push({
      stageName,
      materialCost,
      labourCost,
      totalCost: materialCost + labourCost,
      items
    });
  });

  // 4. Build Floor-wise Breakdown array
  const floorWiseBreakdown: FloorWiseBreakdown[] = [];
  const floorKeysToProcess: ('ground' | 'first' | 'second' | 'logistics')[] = [];
  
  floorsKeys.forEach((key) => floorKeysToProcess.push(key));
  floorKeysToProcess.push('logistics');

  floorKeysToProcess.forEach((key) => {
    const floorItems = itemsList.filter(item => item.floorKey === key);
    if (floorItems.length === 0) return;

    const fName = key === 'ground' ? 'Ground Floor' : key === 'first' ? 'First Floor' : key === 'second' ? 'Second Floor' : 'Shared Site Setup & Logistics';
    
    // Calculate covered area for this specific floor
    let fCoveredArea = 0;
    if (key !== 'logistics') {
      const rooms = key === 'ground'
        ? (layout.floors?.ground?.rooms || layout.rooms || [])
        : (layout.floors?.[key]?.rooms || []);
      const builtRooms = rooms.filter(r => r.type !== 'lawn');
      builtRooms.forEach((r) => {
        fCoveredArea += r.width * r.height;
      });
      if (isMeters) {
        fCoveredArea = fCoveredArea * 10.7639;
      }
      if (fCoveredArea <= 0) {
        fCoveredArea = layout.width * layout.length;
        if (isMeters) fCoveredArea = fCoveredArea * 10.7639;
      }
    }

    const materialCost = floorItems.reduce((sum, item) => sum + item.materialCost, 0);
    const labourCost = floorItems.reduce((sum, item) => sum + item.labourCost, 0);
    const totalCost = materialCost + labourCost;

    let fCement = 0;
    let fSteel = 0;
    let fBricks = 0;
    let fSand = 0;
    let fCrush = 0;
    let fShuttering = 0;

    floorItems.forEach((item) => {
      fCement += item.cementBags;
      fSteel += item.steelTons;
      fBricks += item.bricksCount;
      fSand += item.sandCft;
      fCrush += item.crushCft;
      fShuttering += item.shutteringSqFt;
    });

    const fBindingWire = Math.round(fSteel * 10);

    floorWiseBreakdown.push({
      floorKey: key,
      floorName: fName,
      coveredAreaSqFt: fCoveredArea,
      materialCost,
      labourCost,
      totalCost,
      materialBreakdown: {
        cementBags: fCement,
        steelTons: Math.round(fSteel * 100) / 100,
        bricksCount: fBricks,
        sandCft: fSand,
        crushCft: fCrush,
        bindingWireKg: fBindingWire,
        shutteringSqFt: fShuttering
      }
    });
  });

  // 5. Total Project Cost
  const totalMaterialCost = itemsList.reduce((sum, item) => sum + item.materialCost, 0);
  const totalLabourCost = itemsList.reduce((sum, item) => sum + item.labourCost, 0);
  const grandTotal = totalMaterialCost + totalLabourCost;
  const costPerSqFt = totalCoveredAreaSqFt > 0 ? grandTotal / totalCoveredAreaSqFt : 0;

  return {
    coveredAreaSqFt: totalCoveredAreaSqFt,
    floorsCount,
    materialBreakdown: {
      cementBags: totalCementBags,
      steelTons: Math.round(totalSteelTons * 100) / 100,
      bricksCount: totalBricksCount,
      sandCft: totalSandCft,
      crushCft: totalCrushCft,
      bindingWireKg: totalBindingWireKg,
      shutteringSqFt: totalShutteringSqFt
    },
    stages,
    totalMaterialCost,
    totalLabourCost,
    grandTotal,
    costPerSqFt,
    floorWiseBreakdown
  };
}
