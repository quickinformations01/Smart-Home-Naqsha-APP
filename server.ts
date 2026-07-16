import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { generateProceduralLayout } from './src/utils/layoutGenerator';

// Initialize Express app
const app = express();
const PORT = 3000;

// Enable JSON parser
app.use(express.json());

// Initialize Gemini SDK with named parameters as specified in guidelines
// We wrap it in a function to lazily initialize or handle missing keys gracefully
let ai: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.warn('GEMINI_API_KEY environment variable is not defined or is placeholder. Falling back to procedural layout generator.');
      return null;
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

// 2D Floor Plan layout schema matching types.ts
const layoutResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.OBJECT,
      properties: {
        recommendedBedrooms: { type: Type.INTEGER, description: 'Number of recommended bedrooms' },
        bathrooms: { type: Type.INTEGER, description: 'Number of bathrooms' },
        kitchen: { type: Type.STRING, description: 'e.g., Closed Kitchen, Open Kitchen' },
        tvLounge: { type: Type.STRING, description: 'e.g., Yes, No' },
        drawingRoom: { type: Type.STRING, description: 'e.g., Yes, No' },
        garage: { type: Type.STRING, description: 'e.g., 1 Car, 2 Cars, No' },
        lawn: { type: Type.STRING, description: 'e.g., Front Lawn, Backyard, No' },
        otherFeatures: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Other features like staircase, store room, shafts',
        },
      },
      required: ['recommendedBedrooms', 'bathrooms', 'kitchen', 'tvLounge', 'drawingRoom', 'garage', 'lawn', 'otherFeatures'],
    },
    rooms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique room identifier, e.g., room_1' },
          name: { type: Type.STRING, description: 'Human readable name, e.g., Master Bedroom, Kitchen' },
          type: {
            type: Type.STRING,
            description: 'Must be one of: bedroom, bathroom, kitchen, living, drawing, dining, garage, lawn, staircase, corridor, other',
          },
          x: { type: Type.NUMBER, description: 'X-coordinate of top-left corner in specified unit' },
          y: { type: Type.NUMBER, description: 'Y-coordinate of top-left corner in specified unit' },
          width: { type: Type.NUMBER, description: 'Width of the room in specified unit' },
          height: { type: Type.NUMBER, description: 'Height of the room in specified unit' },
        },
        required: ['id', 'name', 'type', 'x', 'y', 'width', 'height'],
      },
    },
    doors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique door identifier, e.g., door_1' },
          roomId: { type: Type.STRING, description: 'Room ID this door belongs to' },
          x: { type: Type.NUMBER, description: 'X-coordinate of door' },
          y: { type: Type.NUMBER, description: 'Y-coordinate of door' },
          width: { type: Type.NUMBER, description: 'Door width (standard is 2.5 to 3.5)' },
          type: { type: Type.STRING, description: 'Must be horizontal or vertical' },
          isMain: { type: Type.BOOLEAN, description: 'True if main entrance gate or door' },
        },
        required: ['id', 'x', 'y', 'width', 'type'],
      },
    },
    windows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique window identifier, e.g., window_1' },
          roomId: { type: Type.STRING, description: 'Room ID this window belongs to' },
          x: { type: Type.NUMBER, description: 'X-coordinate' },
          y: { type: Type.NUMBER, description: 'Y-coordinate' },
          width: { type: Type.NUMBER, description: 'Window width (typically 3 to 6)' },
          type: { type: Type.STRING, description: 'Must be horizontal or vertical' },
        },
        required: ['id', 'x', 'y', 'width', 'type'],
      },
    },
  },
  required: ['summary', 'rooms', 'doors', 'windows'],
};

// API Endpoint for generating layout using Gemini
app.post('/api/generate-naqsha', async (req, res) => {
  const { width, length, unit, preferences, plotType, facing } = req.body;

  if (!width || !length || !unit) {
    return res.status(400).json({ error: 'Width, length, and unit are required.' });
  }

  const client = getGeminiClient();
  if (!client) {
    // Graceful fallback to procedural generator
    console.log('Gemini API client not initialized. Using procedural fallback.');
    const layout = generateProceduralLayout(Number(width), Number(length), unit, { ...preferences, plotType, facing });
    return res.json({ layout, fallback: true, message: 'Generated using local architecture planner.' });
  }

  try {
    const prompt = `You are a professional residential architect. Generate a highly realistic and practical 2D floor plan (Naqsha) for a rectangular plot.
Dimensions: Width = ${width} ${unit}, Length = ${length} ${unit}.
Preferences requested by user:
- Bedrooms: ${preferences?.bedrooms ?? 'Auto-analyze'}
- Bathrooms: ${preferences?.bathrooms ?? 'Auto-analyze'}
- Kitchen: ${preferences?.kitchenType ?? 'Auto-analyze'}
- Garage: ${preferences?.garage ?? 'Auto-analyze'}
- Drawing Room: ${preferences?.drawingRoom ?? 'Auto-analyze'}
- Lawn: ${preferences?.lawn ?? 'Auto-analyze'}

CRITICAL ARCHITECTURAL RULES:
1. Plot Boundary: All coordinates (x, y) and dimensions (width, height) MUST fit perfectly within x: [0, ${width}] and y: [0, ${length}].
2. Non-Overlapping: Rooms must share walls cleanly and MUST NOT overlap or leave random gaps between each other (except for open spaces like lawns or shafts).
3. Layout Structure:
   - Back of plot (y = 0) should contain bedrooms for privacy.
   - Front of plot (y = ${length}) contains the main entrance, porch/garage (e.g., size 12-14 wide by 14-16 long), and drawing room.
   - The TV Lounge/Living room is in the center (y in middle) acting as a main corridor/connection space.
   - Bathrooms: attached baths must be adjacent or inside bedrooms; common bath should be near lounge/drawing.
   - Kitchen: placed in middle zone, ventilated properly.
4. Doors & Windows:
   - Doors must be placed EXACTLY on the walls/edges of their respective rooms (type "horizontal" for top/bottom walls, type "vertical" for left/right walls).
   - Windows must be on outer external boundaries or facing lawns/ventilation shafts.
5. All coordinates and sizes must be numbers in the specified unit (${unit}).`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert residential architect specializing in generating highly realistic, functional 2D floor plans that maximize space efficiency and proper ventilation.',
        responseMimeType: 'application/json',
        responseSchema: layoutResponseSchema,
        temperature: 0.2, // Low temperature for higher accuracy with coordinates
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(text);
    // Inject the width, length, and unit into the final layout object
    const finalLayout = {
      width: Number(width),
      length: Number(length),
      unit,
      plotType: plotType || 'standard',
      facing: facing || 'east',
      summary: parsed.summary,
      rooms: parsed.rooms,
      doors: parsed.doors,
      windows: parsed.windows,
    };

    return res.json({ layout: finalLayout, fallback: false });
  } catch (err: any) {
    console.error('Error in Gemini layout generation:', err);
    // Fallback to procedural generator on error
    const layout = generateProceduralLayout(Number(width), Number(length), unit, { ...preferences, plotType, facing });
    return res.json({
      layout,
      fallback: true,
      message: 'Generated using local architecture planner (Gemini API errored or timed out).',
    });
  }
});

// Configure Vite or Static Asset serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Home Naqsha server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
