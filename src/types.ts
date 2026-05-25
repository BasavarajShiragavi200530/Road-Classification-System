export type RoadType = 
  | "Highway" 
  | "Paved Road" 
  | "Unpaved Road" 
  | "Gravel Road" 
  | "Residential Road" 
  | "Rural Road";

export interface FeatureExtraction {
  material: string;
  roadWidthMeters: number;
  laneMarkings: string;
  vegetationDensity: string;
  buildingDensity: string;
  surfaceStatus: string;
}

export interface MaterialConfidence {
  asphalt: number;
  gravel: number;
  dirt: number;
}

export interface ClassificationResult {
  roadType: RoadType;
  confidence: number;
  visualAnalysis: string;
  features: FeatureExtraction;
  conditionScore: number;
  geographicContext: string;
  planningRecommendation: string;
  materialConfidence: MaterialConfidence;
  isMock?: boolean;
}

export interface GISImagePreset {
  id: string;
  label: string;
  url: string;
  description: string;
  groundTruth: RoadType;
}

export interface Hyperparameters {
  learningRate: number;
  batchSize: number;
  epochs: number;
  dropout: number;
  optimizer: "Adam" | "SGD" | "RMSprop";
  modelType: "ResNet-50" | "MobileNet-v3" | "Custom CNN (5-Layer)" | "Vision Transformer (ViT)";
}

export interface TrainingMetricPoint {
  epoch: number;
  loss: number;
  valLoss: number;
  accuracy: number;
  valAccuracy: number;
}

export interface TermLog {
  id: string;
  text: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
}

export interface ClassMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}
