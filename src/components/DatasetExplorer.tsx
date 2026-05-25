import { useState } from "react";
import { GISImagePreset, RoadType } from "../types";
import { FolderOpen, Eye, Info, Database, Layers, Radio } from "lucide-react";

interface DatasetExplorerProps {
  presets: GISImagePreset[];
  onPresetSelect: (preset: GISImagePreset) => void;
}

export default function DatasetExplorer({ presets, onPresetSelect }: DatasetExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<RoadType | "ALL">("ALL");

  const filteredPresets = selectedCategory === "ALL" 
    ? presets 
    : presets.filter(p => p.groundTruth === selectedCategory);

  const categories: (RoadType | "ALL")[] = [
    "ALL",
    "Highway",
    "Paved Road",
    "Unpaved Road",
    "Gravel Road",
    "Residential Road",
    "Rural Road"
  ];

  // Mock secondary dataset metadata to provide rich, professional GIS details
  const getGisMetaData = (id: string) => {
    switch(id) {
      case "highway":
        return {
          source: "QuickBird-2 High Resolution Satellite",
          resolution: "0.6m / pixel Multispectral",
          dimensions: "512 x 512 px",
          bandRange: "NIR, Red, Green, Blue",
          spatialRatio: "WGS 84 / UTM Zone 32N",
          annotations: ["Multi-lane", "Freeway", "Asphalt Shoulder", "Double Barrier"]
        };
      case "paved":
        return {
          source: "Sentinel-2 Multi-Spectral Instrument",
          resolution: "10.0m / pixel Correlative Resampled",
          dimensions: "512 x 512 px",
          bandRange: "RGB Standard Band 4-3-2",
          spatialRatio: "WGS 84 / Geographic EPSG:4326",
          annotations: ["Forest Crown", "Two-Lane", "Asphalt Surface", "Unmarked Margins"]
        };
      case "gravel":
        return {
          source: "PlanetScope SkySat Constellation",
          resolution: "0.5m / pixel Ortho Aerial-GIS",
          dimensions: "512 x 512 px",
          bandRange: "Visual true-color composite",
          spatialRatio: "WGS 84 / UTM Zone 15N",
          annotations: ["Loose Rocks", "Forest Canopy Cover", "Aggregate Layer", "Crowned Profile"]
        };
      case "unpaved":
        return {
          source: "DigitalGlobe WorldView-3 Precision Satellite",
          resolution: "0.3m / pixel Orthorectified PAN",
          dimensions: "512 x 512 px",
          bandRange: "Panchromatic & Coastal Band",
          spatialRatio: "WGS 84 / UTM Zone 19S",
          annotations: ["Dry Silt", "Severe Gullying", "Erosion Track", "No Roadbed"]
        };
      case "residential":
        return {
          source: "Aerial Orthophoto Orthographic GIS Archive",
          resolution: "0.1m / decimeter ultra-precision",
          dimensions: "512 x 512 px",
          bandRange: "RGB High contrast natural",
          spatialRatio: "NAD 1983 / State Plane Projection",
          annotations: ["Concrete Curbs", "Subdivision grid", "Residential Housing", "Manicured lawns"]
        };
      case "rural":
        return {
          source: "Landsat 8 OLI Landsat-Scale",
          resolution: "15.0m / pixel Pan-sharpened",
          dimensions: "512 x 512 px",
          bandRange: "SWIR, NIR, Thermal Overlay",
          spatialRatio: "WGS 84 / UTM Zone 11N",
          annotations: ["Crop Boundary", "Dirt shoulder", "Single Lane", "Agricultural Grid"]
        };
      default:
        return {
          source: "Sentinel-2 Constellation",
          resolution: "10.0m / pixel Color Composited",
          dimensions: "512 x 512 px",
          bandRange: "Visible standard RGB band",
          spatialRatio: "WGS 84 Coordinate Grid",
          annotations: ["GIS Raster", "Road Class Map"]
        };
    }
  };

  return (
    <div className="space-y-6" id="dataset-explorer-tab">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-sans font-medium text-slate-100">GIS Satellite Roadway Dataset Explorer</h2>
          </div>
          <p className="text-xs text-slate-400 font-sans max-w-md md:text-right">
            Manage preprocessed and labeled spatial data. Our model correlates optical characteristics with these verified labels.
          </p>
        </div>

        {/* Filter Toolbar categories */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {categories.map((cat) => (
            <button
              id={`cat-filter-btn-${cat}`}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-950 text-emerald-400 border-emerald-800/80 font-medium"
                  : "bg-slate-950 text-slate-400 border-slate-900 hover:bg-slate-850 hover:text-slate-200"
              }`}
            >
              {cat === "ALL" ? "All Collected Raster Classes" : cat}
            </button>
          ))}
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredPresets.map((preset) => {
            const meta = getGisMetaData(preset.id);
            return (
              <div
                key={preset.id}
                className="bg-slate-950 rounded-xl border border-slate-850 overflow-hidden flex flex-col justify-between group hover:border-slate-700 transition-all duration-300"
              >
                {/* Visual Imagery Box */}
                <div className="relative aspect-[1.3/1] bg-slate-900 overflow-hidden">
                  <img
                    referrerPolicy="no-referrer"
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-850 rounded px-2 py-0.5 text-[10px] uppercase font-mono text-emerald-400 tracking-wider">
                    {preset.groundTruth}
                  </div>
                </div>

                {/* Imagery Metadata Detail Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-sans font-medium text-slate-200 mb-1 group-hover:text-emerald-400 transition-colors">
                      {preset.label}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-2">
                      {preset.description}
                    </p>
                  </div>

                  {/* Satellite Parameters Stack */}
                  <div className="space-y-2 text-[10px] font-mono border-t border-slate-900 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-1"><Layers className="w-3 h-3" /> Earth Sensor</span>
                      <span className="text-slate-300">{meta.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-1"><Radio className="w-3 h-3" /> Area Resol.</span>
                      <span className="text-slate-300">{meta.resolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-1"><Info className="w-3 h-3" /> Band Limits</span>
                      <span className="text-slate-300">{meta.bandRange}</span>
                    </div>
                  </div>

                  {/* Annotations Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {meta.annotations.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] bg-slate-900 text-slate-400 border border-slate-850 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    id={`view-in-classifier-btn-${preset.id}`}
                    onClick={() => onPresetSelect(preset)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-sans transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Load in Classifier Workstation
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
