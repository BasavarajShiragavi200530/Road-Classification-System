import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable JSON bodies with limit up to 10MB for base64 images
app.use(express.json({ limit: "10mb" }));

// Lazy init Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// ----------------------------------------------------
// API Route: Classify GIS Road Image
// ----------------------------------------------------
app.post("/api/classify", async (req, res) => {
  try {
    const { image, mimeType, isPreset, presetType } = req.body;

    if (!image && !isPreset) {
      return res.status(400).json({ error: "No image data or preset provided." });
    }

    const ai = getGeminiClient();

    if (ai) {
      console.log("Using live Gemini API for GIS road classification.");
      
      let base64Data = "";
      let resolvedMimeType = mimeType || "image/jpeg";

      if (isPreset) {
        // Preset mock image fallback or download preset url, let's pass preset classification parameters directly which are pre-evaluated
        // But let's support classifying any image content passed as base64
        if (image && image.startsWith("data:")) {
          const parts = image.split(",");
          base64Data = parts[1];
          const matchedMime = parts[0].match(/data:(.*?);/);
          if (matchedMime) {
            resolvedMimeType = matchedMime[1];
          }
        } else {
          base64Data = image;
        }
      } else {
        if (image.startsWith("data:")) {
          const parts = image.split(",");
          base64Data = parts[1];
          const matchedMime = parts[0].match(/data:(.*?);/);
          if (matchedMime) {
            resolvedMimeType = matchedMime[1];
          }
        } else {
          base64Data = image;
        }
      }

      const imagePart = {
        inlineData: {
          mimeType: resolvedMimeType,
          data: base64Data,
        },
      };

      const systemInstruction = 
        "You are an expert GIS (Geographic Information System) and remote sensing analyzer with built-in Deep Learning CNN capabilities. " +
        "Analyze the provided aerial/satellite road image. Classify the road into one of these six standard categories: " +
        "'Highway', 'Paved Road', 'Unpaved Road', 'Gravel Road', 'Residential Road', 'Rural Road'. " +
        "Perform visual feature extraction and surface assessment. Be highly precise, mimicking professional remote sensing classification software.";

      const prompt = 
        "Perform GIS feature extraction, visual analysis, and road classification parameters from this satellite/aerial image. " +
        "Assess texture, pixel intensities, road width, markings, material type, and geographic surroundings. Support your predictions with clear evidence.";

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, { text: prompt }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roadType: {
                type: Type.STRING,
                description: "One of: Highway, Paved Road, Unpaved Road, Gravel Road, Residential Road, Rural Road",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence value between 0.75 and 0.99 indicating prediction score",
              },
              visualAnalysis: {
                type: Type.STRING,
                description: "Deep visual and semantic description of the road surface, width, path patterns, and geometry found in the image",
              },
              features: {
                type: Type.OBJECT,
                properties: {
                  material: { type: Type.STRING, description: "Surface material, e.g., Asphalt, Concrete, Dirt, Loose Gravel, Soil" },
                  roadWidthMeters: { type: Type.NUMBER, description: "Estimated average road width in meters" },
                  laneMarkings: { type: Type.STRING, description: "E.g., Clear double yellow, single dashed, none, faded" },
                  vegetationDensity: { type: Type.STRING, description: "Density of surrounding foliage (Low, Medium, High)" },
                  buildingDensity: { type: Type.STRING, description: "Density of surrounding buildings/infrastructure (None, Isolated, Scattered, Grid)" },
                  surfaceStatus: { type: Type.STRING, description: "Smooth, weathered, heavily rutted, dusty, well-maintained" }
                },
                required: ["material", "roadWidthMeters", "laneMarkings", "vegetationDensity", "buildingDensity", "surfaceStatus"]
              },
              conditionScore: {
                type: Type.INTEGER,
                description: "Road surface quality state score between 0 and 100",
              },
              materialConfidence: {
                type: Type.OBJECT,
                properties: {
                  asphalt: { type: Type.NUMBER, description: "Confidence score percentage for asphalt material from 0 to 100" },
                  gravel: { type: Type.NUMBER, description: "Confidence score percentage for gravel material from 0 to 100" },
                  dirt: { type: Type.NUMBER, description: "Confidence score percentage for dirt material from 0 to 100" }
                },
                required: ["asphalt", "gravel", "dirt"]
              },
              geographicContext: {
                type: Type.STRING,
                description: "Typical environment e.g. Mountainous Forest, Plains, Dense Suburban grid, Rural farmland, Arid desert",
              },
              planningRecommendation: {
                type: Type.STRING,
                description: "Recommended GIS action, urban design, or transportation infrastructure planning advice",
              }
            },
            required: ["roadType", "confidence", "visualAnalysis", "features", "conditionScore", "geographicContext", "planningRecommendation", "materialConfidence"]
          }
        }
      });

      const responseText = response.text || "{}";
      const classificationResult = JSON.parse(responseText);

      return res.json({
        ...classificationResult,
        isMock: false
      });
    } else {
      // ----------------------------------------------------
      // Mock Fallback Analyzer
      // ----------------------------------------------------
      console.log("No GEMINI_API_KEY found, running rule-based GIS Classification Sandbox Simulator.");
      
      let finalPresetType = presetType || "highway";
      
      // If we don't have a preset, analyze simulated properties based on base64 content
      // (or let's randomize or simulate depending on what user chose).
      const mockResultDatabase: Record<string, any> = {
        highway: {
          roadType: "Highway",
          confidence: 0.96,
          visualAnalysis: "The image shows a pristine multi-lane asphalt road with highly visible, crisp lane markings. Curves have high-radius geometric alignments indicating optimal high-speed high-capacity engineering.",
          features: {
            material: "Asphalt (High-grade)",
            roadWidthMeters: 24,
            laneMarkings: "Clean solid white shoulders & double yellow median dividers",
            vegetationDensity: "Medium",
            buildingDensity: "Isolated",
            surfaceStatus: "Smooth"
          },
          conditionScore: 92,
          geographicContext: "Interstate corridor transitioning suburban landscapes",
          planningRecommendation: "Maintain active acoustic barrier inspections. Schedule automated thermal imaging for sub-surface wear detection in 12 months.",
          materialConfidence: {
            asphalt: 95.0,
            gravel: 3.0,
            dirt: 2.0
          }
        },
        paved: {
          roadType: "Paved Road",
          confidence: 0.91,
          visualAnalysis: "A standard two-lane local paved thoroughfare. Minor local surface weathering visible underneath low-foliage tree canopies.",
          features: {
            material: "Asphalt / Concrete mix",
            roadWidthMeters: 8,
            laneMarkings: "Single dashed center line, slightly weathered",
            vegetationDensity: "High",
            buildingDensity: "Scattered",
            surfaceStatus: "Weathered"
          },
          conditionScore: 78,
          geographicContext: "Rural forested hills and minor state link coordinates",
          planningRecommendation: "Perform minor asphalt crack sealants to prevent moisture infiltration before winter cycle.",
          materialConfidence: {
            asphalt: 88.0,
            gravel: 8.0,
            dirt: 4.0
          }
        },
        unpaved: {
          roadType: "Unpaved Road",
          confidence: 0.88,
          visualAnalysis: "A primitive earthen forest service road with highly visible erosion tracks. No mechanical lane definition or modern drainage conduits detected.",
          features: {
            material: "Dry Packed Soil / Silt",
            roadWidthMeters: 5,
            laneMarkings: "None",
            vegetationDensity: "Very High",
            buildingDensity: "None",
            surfaceStatus: "Heavily rutted"
          },
          conditionScore: 42,
          geographicContext: "High-density natural preserve and steep mountain terrain",
          planningRecommendation: "Restricted heavy truck usage during wet seasons to limit road bed erosion. Recommend grading and culvert enforcement.",
          materialConfidence: {
            asphalt: 2.0,
            gravel: 18.0,
            dirt: 80.0
          }
        },
        gravel: {
          roadType: "Gravel Road",
          confidence: 0.89,
          visualAnalysis: "A well-graded gravel corridor. Visual characteristics reveal crushed aggregate surface topping and crowned road profile for water runoff.",
          features: {
            material: "Crushed stone aggregate",
            roadWidthMeters: 6,
            laneMarkings: "None",
            vegetationDensity: "Medium",
            buildingDensity: "Isolated Farms",
            surfaceStatus: "Dusty but stable"
          },
          conditionScore: 65,
          geographicContext: "Rural agricultural flatlands",
          planningRecommendation: "Re-apply crushed aggregate resurfacing layer on highly friction-intensive intersections. Maintain dust retardant spray calendar.",
          materialConfidence: {
            asphalt: 29.0,
            gravel: 67.0,
            dirt: 4.0
          }
        },
        residential: {
          roadType: "Residential Road",
          confidence: 0.94,
          visualAnalysis: "An urban neighborhood roadway lined with sidewalks and driveway cutouts. High structural building density immediately adjacent.",
          features: {
            material: "Standard Asphalt",
            roadWidthMeters: 10,
            laneMarkings: "Faded curbside parking guides",
            vegetationDensity: "Medium (Manicured lawns)",
            buildingDensity: "Grid Neighbor Layout",
            surfaceStatus: "Well-maintained with minor pavement cuts"
          },
          conditionScore: 82,
          geographicContext: "Metropolitan suburban zone",
          planningRecommendation: "Install traffic calming components (speed pillows or chicanes) to ensure local neighborhood speed caps remain safe.",
          materialConfidence: {
            asphalt: 91.0,
            gravel: 5.0,
            dirt: 4.0
          }
        },
        rural: {
          roadType: "Rural Road",
          confidence: 0.85,
          visualAnalysis: "A narrow single-lane farm collector lane bordering grain silos and crop grids. Vegetation borders are dense, and shoulders are soft/vegetated.",
          features: {
            material: "Chipseal over granular base",
            roadWidthMeters: 5.5,
            laneMarkings: "None",
            vegetationDensity: "High crops and shrublands",
            buildingDensity: "Agricultural structures only",
            surfaceStatus: "Weathered edges with minor potholes"
          },
          conditionScore: 58,
          geographicContext: "Intensive crop farming rural sector",
          planningRecommendation: "Evaluate edge drop-offs for gravel shoulder wedge integration. Standardize agricultural heavy-vehicle warning signage.",
          materialConfidence: {
            asphalt: 45.0,
            gravel: 30.0,
            dirt: 25.0
          }
        }
      };

      // Best effort matching if non-preset is uploaded
      let matchedKey = "highway";
      if (!isPreset && image) {
        // pick at random or depending on image properties/length to keep variations exciting!
        const len = image.length || 100;
        const keys = Object.keys(mockResultDatabase);
        matchedKey = keys[len % keys.length];
      } else {
        matchedKey = finalPresetType;
      }

      const mockData = mockResultDatabase[matchedKey] || mockResultDatabase.highway;

      // Add a small artificial delay to simulate ML processing
      await new Promise(resolve => setTimeout(resolve, 800));

      return res.json({
        ...mockData,
        isMock: true
      });
    }
  } catch (error: any) {
    console.error("Classification error in server:", error);
    return res.status(500).json({ error: error.message || "Failed to classify image." });
  }
});


// ----------------------------------------------------
// Production / Dev entry points
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static build routing setup loaded.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GIS Classifier application running on http://localhost:${PORT}`);
  });
}

startServer();
