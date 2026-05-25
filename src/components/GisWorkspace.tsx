import React, { useState, useRef } from "react";
import { 
  Upload, Sparkles, HelpCircle, HardDrive, Compass, Info, AlertCircle, CheckCircle, ListOrdered, FileText, ChevronRight, Cpu
} from "lucide-react";
import { GISImagePreset, ClassificationResult, RoadType } from "../types";

interface GisWorkspaceProps {
  presets: GISImagePreset[];
  selectedPreset: GISImagePreset;
  onPresetSelect: (preset: GISImagePreset) => void;
  customImage: string | null;
  onCustomImageChange: (base64: string | null) => void;
  isTrained: boolean;
}

export default function GisWorkspace({ 
  presets, 
  selectedPreset, 
  onPresetSelect, 
  customImage, 
  onCustomImageChange,
  isTrained
}: GisWorkspaceProps) {
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File Upload Handlers (Handles Drag and Drop + Manual Select)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setApiError("Invalid format. Please supply a valid GIS raster PNG or JPEG image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onCustomImageChange(base64);
      setResult(null);
      setApiError(null);
    };
    reader.onerror = () => {
      setApiError("Failure compiling local raster bytes.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleClearCustom = () => {
    onCustomImageChange(null);
    setResult(null);
    setApiError(null);
  };

  // Trigger classification analysis via backend API
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setApiError(null);

    const isPreset = !customImage;
    const payload = isPreset 
      ? { isPreset: true, presetType: selectedPreset.id, image: selectedPreset.url }
      : { isPreset: false, image: customImage };

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Inference endpoint returned error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error("Analysis failure:", err);
      setApiError(err.message || "Failed to classify image. Ensure express server is online.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Extract values if result is available
  const pType = result?.roadType || "Highway";
  const pConfidence = result?.confidence || 0.90;
  const conditionalScore = result?.conditionScore || 80;

  // Confidence color maps
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.90) return "text-emerald-400 stroke-emerald-400";
    if (conf >= 0.80) return "text-sky-400 stroke-sky-400";
    return "text-amber-400 stroke-amber-400";
  };

  const getPredictedMaterial = () => {
    if (!result?.materialConfidence) return "Asphalt";
    const { asphalt, gravel, dirt } = result.materialConfidence;
    if (gravel >= asphalt && gravel >= dirt) return "Gravel";
    if (dirt >= asphalt && dirt >= gravel) return "Dirt";
    return "Asphalt";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="gi-workspace-view">
      {/* Handlers, Upload, Presets & Action Panel */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* CNN Mode Alert banner */}
        {isTrained && (
          <div className="bg-emerald-955/20 border border-emerald-900/40 p-4 rounded-xl flex items-start gap-2 text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold uppercase font-mono tracking-wider">Custom-Trained CNN Active</span>
              <p className="opacity-80 mt-0.5">Classification predictions on custom maps will use calibrated tensor vectors.</p>
            </div>
          </div>
        )}

        {/* DRAG AND DROP FILE UPLOADER & RASTER CONTAINER */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-wider text-slate-300">Target Raster Image</h3>
            {customImage && (
              <button 
                id="clear-custom-image-btn"
                onClick={handleClearCustom} 
                className="text-xs text-rose-450 hover:underline font-mono"
              >
                Reset Image
              </button>
            )}
          </div>

          {/* Interactive Dropping Area */}
          <div
            id="drag-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!customImage ? triggerFileSelect : undefined}
            className={`border rounded-xl aspect-[1.4/1] flex flex-col items-center justify-center p-4 transition-all duration-300 cursor-pointer overflow-hidden relative group ${
              customImage 
                ? "border-slate-800 bg-slate-950" 
                : isDragOver
                ? "border-emerald-500 bg-emerald-950/20"
                : "border-dashed border-slate-700 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-950/80"
            }`}
          >
            <input
              id="raster-file-input"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {customImage ? (
              <img
                referrerPolicy="no-referrer"
                src={customImage} 
                alt="Selected raster view" 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center space-y-3">
                <div className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center mx-auto border border-slate-800 group-hover:border-slate-700 transition" id="upload-svg-box">
                  <Upload className="w-5 h-5 text-slate-450 group-hover:text-emerald-400 group-hover:scale-105 transition" />
                </div>
                <div>
                  <p className="text-xs font-sans text-slate-350">
                    <span className="text-emerald-400 font-semibold">Click to upload</span> or drag and drop raster images
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">PNG, JPG, SATELLITE TILES</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Preset Library Loader if No custom uploaded */}
          {!customImage && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">Or Select GIS Dataset Preset</span>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((p) => (
                  <button
                    id={`preset-btn-${p.id}`}
                    key={p.id}
                    onClick={() => onPresetSelect(p)}
                    className={`text-xs py-2 px-1 text-center rounded-lg border transition-all truncate hover:border-slate-755 ${
                      selectedPreset.id === p.id 
                        ? "bg-slate-800 text-emerald-300 border-slate-700 font-medium" 
                        : "bg-slate-950 text-slate-400 border-slate-900"
                    }`}
                  >
                    {p.groundTruth.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ANALYZE COMPONENT ACTIONS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 header">Target Image Metadata</h4>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-400 space-y-1.5 border border-slate-950">
              <div className="flex justify-between">
                <span>Raster Node:</span>
                <span className="text-slate-300">{customImage ? "USER_RASTER.tif" : `${selectedPreset.id}_coordinates.png`}</span>
              </div>
              <div className="flex justify-between">
                <span>Ground Truth (Ref):</span>
                <span className="text-slate-250 font-semibold">{customImage ? "UNKNOWN" : selectedPreset.groundTruth}</span>
              </div>
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="text-slate-500">
                  {customImage ? "45.021° N, 122.954° W" : "UTM Zone 32N / E: 395100, N: 5122100"}
                </span>
              </div>
            </div>
          </div>

          <button
            id="classify-trigger-btn"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.01] text-slate-950 font-sans font-medium text-sm rounded-lg transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                Evaluating Convolution Tensors...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                Classify Road Type
              </>
            )}
          </button>

          {apiError && (
            <div className="bg-rose-955/20 border border-rose-900/40 p-3 rounded-lg flex items-start gap-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <p className="leading-normal">{apiError}</p>
            </div>
          )}
        </div>

        {/* Gemini Engine Notice Credentials */}
        <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl flex items-start gap-2.5 text-slate-500 text-xs font-sans">
          <Info className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            By default, the server runs a rule-based AI Sandbox fallback. To enable full advanced satellite analysis, set up your <span className="font-semibold text-slate-400">GEMINI_API_KEY</span> in the Secrets manager in Google AI Studio.
          </p>
        </div>
      </div>

      {/* CLASSIFICATION ANALYSIS OUTPUT */}
      <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-6 min-h-[400px] flex flex-col justify-between">
        {result ? (
          <div className="space-y-6" id="inference-results-panel">
            {/* MATCHING USER PREDICTION INTERFACE SPECIFICATION */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 font-sans uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Neural Material Classification Core
              </h3>
              
              <div className="bg-slate-950 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-450 uppercase tracking-widest font-mono">Prediction</h4>
                  <div className="py-1">
                    <span id="predicted-material-badge" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-sm px-6 py-2 rounded-full shadow-sm transition">
                      {getPredictedMaterial()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-slate-400 font-sans tracking-wide font-mono uppercase tracking-wider">Confidence</h4>
                  
                  <div className="space-y-2">
                    {[
                      { name: "Asphalt", value: result.materialConfidence?.asphalt ?? 0 },
                      { name: "Gravel", value: result.materialConfidence?.gravel ?? 0 },
                      { name: "Dirt", value: result.materialConfidence?.dirt ?? 0 }
                    ].map((mat) => (
                      <div 
                        key={mat.name}
                        className="flex justify-between items-center bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 hover:bg-slate-900/100 transition-all shadow-sm"
                      >
                        <span className="text-sm font-medium text-slate-300">{mat.name}</span>
                        <span className="text-sm font-bold text-white font-mono">
                          {mat.value.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Predicted Class Name & Confidence Circular SVG Meter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-900 pb-5">
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block">Classifier Output</span>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-sans font-semibold text-slate-100 tracking-tight">{pType}</h2>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/60 font-semibold uppercase tracking-wider font-mono px-2 py-0.5 rounded">
                    Identified Class
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[11px] font-sans text-slate-450">Geographic Context:</span>
                  <span className="text-[11px] font-mono text-emerald-300 font-semibold">{result.geographicContext}</span>
                </div>
              </div>

              {/* Confidence Gauge SVG */}
              <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-900 min-w-[160px]">
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r="19" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle 
                      cx="24" 
                      cy="24" 
                      r="19" 
                      fill="none" 
                      className={getConfidenceColor(pConfidence)}
                      strokeWidth="3.5" 
                      strokeDasharray={`${2 * Math.PI * 19}`}
                      strokeDashoffset={`${2 * Math.PI * 19 * (1 - pConfidence)}`}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-mono text-slate-300 font-bold">
                    {Math.round(pConfidence * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Network Confidence</span>
                  <span className="text-xs font-semibold text-slate-300">High Precision Correlation</span>
                </div>
              </div>
            </div>

            {/* Extracted Features Specs Check Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Extracted Visual Features</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Surface Material", val: result.features.material },
                  { label: "Lane Markings", val: result.features.laneMarkings },
                  { label: "Est. Width (Meters)", val: `${result.features.roadWidthMeters} meters` },
                  { label: "Surface Quality", val: result.features.surfaceStatus },
                  { label: "Vegetation Density", val: result.features.vegetationDensity },
                  { label: "Infrastructure Density", val: result.features.buildingDensity }
                ].map((ft, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-850 p-3 rounded-lg space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">{ft.label}</span>
                    <span className="text-xs font-sans text-slate-250 font-medium">{ft.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Condition quality metric visual bar */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-sans font-medium text-slate-300">Surface Engineering Condition Index</span>
                <span className="font-mono text-xs text-emerald-400 font-semibold">{conditionalScore} / 100</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                <div 
                  className={`h-full transition-all duration-700 ${
                    conditionalScore >= 80 
                      ? "bg-emerald-400 shadow-glow" 
                      : conditionalScore >= 55 
                      ? "bg-amber-400" 
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${conditionalScore}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                Aggressive texture analysis estimates surface smoothness, pitting, and friction layers to guide maintenance intervals.
              </p>
            </div>

            {/* Visual description analysis text */}
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-900">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-slate-450" /> CNN Visual Core Evidence
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {result.visualAnalysis}
              </p>
            </div>

            {/* Spatial Planning Recommendation */}
            <div className="bg-emerald-950/25 border border-emerald-900/40 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Spatial & Transportation Engineering Advice
              </h4>
              <p className="text-xs text-slate-350 leading-relaxed font-sans">
                {result.planningRecommendation}
              </p>
            </div>

            <div className="text-[10px] text-slate-600 font-mono text-right font-light">
              {result.isMock ? "LOCAL SIMULATION INFERENCE CORE MODEL_T_0" : "LIVE GEMINI_API_CORE INF_MODEL_AISTUDIO"}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <HardDrive className="w-6 h-6 animate-pulse text-slate-500" />
            </div>
            <div>
              <h3 className="text-sm font-sans font-medium text-slate-350 uppercase">Satellite Inference Output Panel</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1 font-sans">
                Select a GIS preset or upload your satellite imagery on the left, then click <span className="font-semibold text-slate-400">Classify Road Type</span> to trigger neural prediction analysis.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
