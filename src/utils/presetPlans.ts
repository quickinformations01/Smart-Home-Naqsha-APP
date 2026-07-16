import { generateProceduralLayout } from './layoutGenerator';
import { NaqshaLayout } from '../types';

export interface PresetPlan {
  id: string;
  name: string;
  description: string;
  width: number;
  length: number;
  unit: 'ft' | 'm';
  bedrooms: number;
  bathrooms: number;
  plotType: 'corner' | 'standard';
  facing: 'north' | 'south' | 'east' | 'west';
  getLayout: () => NaqshaLayout;
}

export const PRESET_PLANS: PresetPlan[] = [
  {
    id: 'preset_townhouse',
    name: 'Compact 3-Bed Townhouse',
    description: 'Perfect for standard urban residential plots. This layout features a smart open kitchen, staircase lobby, and rear ventilation ducts to ensure abundant natural airflow.',
    width: 30,
    length: 45,
    unit: 'ft',
    bedrooms: 3,
    bathrooms: 2,
    plotType: 'standard',
    facing: 'east',
    getLayout: () => {
      const layout = generateProceduralLayout(30, 45, 'ft', {
        bedrooms: 3,
        bathrooms: 2,
        kitchenType: 'Open',
        garage: 'Yes',
        drawingRoom: 'Yes',
        lawn: 'No',
        plotType: 'standard',
        facing: 'east',
        floor: 'ground',
      });
      // Further fine-tune name or specific summary features
      layout.summary.otherFeatures = [
        ...layout.summary.otherFeatures,
        'Specially designed for compact 30x45 standard townhouses.',
        'High-density room-to-open-space ratio.'
      ];
      return layout;
    }
  },
  {
    id: 'preset_villa',
    name: 'Spacious Luxury Villa',
    description: 'An executive double-width mansion design. Outfitted with a grand drawing room, expansive front lawn garden, executive bedrooms with walk-in dressers, and a double parking porch.',
    width: 50,
    length: 80,
    unit: 'ft',
    bedrooms: 4,
    bathrooms: 4,
    plotType: 'corner',
    facing: 'south',
    getLayout: () => {
      const layout = generateProceduralLayout(50, 80, 'ft', {
        bedrooms: 4,
        bathrooms: 4,
        kitchenType: 'Closed',
        garage: 'Yes',
        drawingRoom: 'Yes',
        lawn: 'Yes',
        plotType: 'corner',
        facing: 'south',
        floor: 'ground',
      });
      layout.summary.otherFeatures = [
        ...layout.summary.otherFeatures,
        'Luxury 50x80 premium double-unit footprint.',
        'Features a majestic formal entrance lobby.',
        'Equipped with side passages for multi-directional airflow.'
      ];
      return layout;
    }
  },
  {
    id: 'preset_studio',
    name: 'Cozy Modern Studio Suite',
    description: 'An elegant minimalist single-bed layout ideal for micro-plots, backyard suites, or vacation cottages. Blends an airy living-dining area with an space-saving open kitchenette.',
    width: 20,
    length: 30,
    unit: 'ft',
    bedrooms: 1,
    bathrooms: 1,
    plotType: 'standard',
    facing: 'west',
    getLayout: () => {
      const layout = generateProceduralLayout(20, 30, 'ft', {
        bedrooms: 1,
        bathrooms: 1,
        kitchenType: 'Open',
        garage: 'No',
        drawingRoom: 'No',
        lawn: 'No',
        plotType: 'standard',
        facing: 'west',
        floor: 'ground',
      });
      layout.summary.otherFeatures = [
        ...layout.summary.otherFeatures,
        'Minimalist 20x30 ultra-efficient studio config.',
        'Integrated multi-purpose living/dining zone.'
      ];
      return layout;
    }
  },
  {
    id: 'preset_duplex',
    name: 'Duplex Family Residence',
    description: 'Two-story multigenerational house plan featuring a stylish circular staircase link, a cozy central family lounge, an integrated kids\' bedroom, and an outdoor planter patio.',
    width: 40,
    length: 60,
    unit: 'ft',
    bedrooms: 3,
    bathrooms: 3,
    plotType: 'standard',
    facing: 'north',
    getLayout: () => {
      const layout = generateProceduralLayout(40, 60, 'ft', {
        bedrooms: 3,
        bathrooms: 3,
        kitchenType: 'Closed',
        garage: 'Yes',
        drawingRoom: 'Yes',
        lawn: 'Yes',
        plotType: 'standard',
        facing: 'north',
        floor: 'ground',
      });
      layout.summary.otherFeatures = [
        ...layout.summary.otherFeatures,
        'Spacious 40x60 duplex house layout.',
        'Dual-access staircase link for first-floor autonomy.',
        'Dedicated backyard washing area and garden.'
      ];
      return layout;
    }
  },
  {
    id: 'preset_corner',
    name: 'Double Frontage Corner House',
    description: 'Maximize your corner plot advantage with double frontage visual layouts, dual patios, side verandas, and double-ventilation windows on both side walls.',
    width: 35,
    length: 50,
    unit: 'ft',
    bedrooms: 3,
    bathrooms: 3,
    plotType: 'corner',
    facing: 'east',
    getLayout: () => {
      const layout = generateProceduralLayout(35, 50, 'ft', {
        bedrooms: 3,
        bathrooms: 3,
        kitchenType: 'Closed',
        garage: 'Yes',
        drawingRoom: 'Yes',
        lawn: 'Yes',
        plotType: 'corner',
        facing: 'east',
        floor: 'ground',
      });
      layout.summary.otherFeatures = [
        ...layout.summary.otherFeatures,
        'Corner-optimized double-wall light capture design.',
        'Multi-entrance capability with side gate configuration.'
      ];
      return layout;
    }
  }
];
