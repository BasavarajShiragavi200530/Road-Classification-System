import { GISImagePreset, Hyperparameters, ClassMetrics } from "./types";

export const GIS_PRESETS: GISImagePreset[] = [
  {
    id: "highway",
    label: "Interstate Freeway Interchange",
    url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80",
    description: "Multi-lane high-speed concrete/asphalt arterial road network with distinct flyover structures and lane separators.",
    groundTruth: "Highway"
  },
  {
    id: "paved",
    label: "Mountain Highway Ridge",
    url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80",
    description: "Standard two-lane fully paved country state route with moderate local elevation contours.",
    groundTruth: "Paved Road"
  },
  {
    id: "gravel",
    label: "Forested Logging Spur",
    url: "https://images.unsplash.com/photo-1508873696983-2df519f0397e?w=600&auto=format&fit=crop&q=80",
    description: "Compact gravel utility corridor heavily integrated into dense conifer forest terrain, showcasing loose stone surfaces.",
    groundTruth: "Gravel Road"
  },
  {
    id: "unpaved",
    label: "Alpine Ridge Trail",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80",
    description: "Arid, unpaved service track with high weathering, structural rock hazards, and no commercial road base markers.",
    groundTruth: "Unpaved Road"
  },
  {
    id: "residential",
    label: "Suburban Subdivision Link",
    url: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&auto=format&fit=crop&q=80",
    description: "Standard municipal neighborhood street showcasing high building densities, concrete curbing, and domestic driveways.",
    groundTruth: "Residential Road"
  },
  {
    id: "rural",
    label: "Agricultural Farm Belt",
    url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80",
    description: "Narrow single-lane rural paved collector lane surrounded by extensive crop grids and unpaved shoulders.",
    groundTruth: "Rural Road"
  }
];

export const DEFAULT_HYPERPARAMETERS: Hyperparameters = {
  learningRate: 0.001,
  batchSize: 32,
  epochs: 10,
  dropout: 0.3,
  optimizer: "Adam",
  modelType: "Custom CNN (5-Layer)"
};

export const MOCK_REPORT_METRICS: Record<string, ClassMetrics> = {
  "Highway": { precision: 0.95, recall: 0.94, f1Score: 0.94, support: 110 },
  "Paved Road": { precision: 0.89, recall: 0.91, f1Score: 0.90, support: 154 },
  "Unpaved Road": { precision: 0.82, recall: 0.80, f1Score: 0.81, support: 85 },
  "Gravel Road": { precision: 0.88, recall: 0.86, f1Score: 0.87, support: 96 },
  "Residential Road": { precision: 0.92, recall: 0.94, f1Score: 0.93, support: 132 },
  "Rural Road": { precision: 0.84, recall: 0.82, f1Score: 0.83, support: 120 }
};

export const MOCK_CONFUSION_MATRIX: Record<string, Record<string, number>> = {
  "Highway": { "Highway": 103, "Paved Road": 5, "Unpaved Road": 0, "Gravel Road": 0, "Residential Road": 2, "Rural Road": 0 },
  "Paved Road": { "Highway": 3, "Paved Road": 140, "Unpaved Road": 1, "Gravel Road": 2, "Residential Road": 5, "Rural Road": 3 },
  "Unpaved Road": { "Highway": 0, "Paved Road": 1, "Unpaved Road": 68, "Gravel Road": 12, "Residential Road": 0, "Rural Road": 4 },
  "Gravel Road": { "Highway": 0, "Paved Road": 2, "Unpaved Road": 9, "Gravel Road": 83, "Residential Road": 0, "Rural Road": 2 },
  "Residential Road": { "Highway": 2, "Paved Road": 4, "Unpaved Road": 0, "Gravel Road": 0, "Residential Road": 124, "Rural Road": 2 },
  "Rural Road": { "Highway": 0, "Paved Road": 6, "Unpaved Road": 4, "Gravel Road": 8, "Residential Road": 3, "Rural Road": 99 }
};
