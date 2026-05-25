import React, { useRef, useEffect, useState } from "react";
import { Sliders, Sun, Zap, HelpCircle, Activity, RotateCcw, Image as ImageIcon } from "lucide-react";
import { GISImagePreset } from "../types";

interface CVSandboxProps {
  presets: GISImagePreset[];
  selectedPreset: GISImagePreset;
  onPresetSelect: (preset: GISImagePreset) => void;
  customImage: string | null;
}

export default function CVSandbox({ presets, selectedPreset, onPresetSelect, customImage }: CVSandboxProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<"none" | "grayscale" | "sobel" | "threshold" | "invert">("sobel");
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [threshValue, setThreshValue] = useState<number>(128);
  const [processing, setProcessing] = useState<boolean>(false);

  const imageUrl = customImage || selectedPreset.url;

  useEffect(() => {
    applyComputerVision();
  }, [imageUrl, activeFilter, brightness, contrast, threshValue]);

  const applyComputerVision = () => {
    const canvas = canvasRef.current;
    const origCanvas = originalCanvasRef.current;
    if (!canvas || !origCanvas) return;

    setProcessing(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const ctx = canvas.getContext("2d");
      const origCtx = origCanvas.getContext("2d");
      if (!ctx || !origCtx) {
        setProcessing(false);
        return;
      }

      // Constrain size for CPU performance but keep detail
      const maxWidth = 400;
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      canvas.width = w;
      canvas.height = h;
      origCanvas.width = w;
      origCanvas.height = h;

      // Draw original
      origCtx.drawImage(img, 0, 0, w, h);

      // Draw filter target
      ctx.drawImage(img, 0, 0, w, h);
      
      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Apply Brightness & Contrast
        const bMul = brightness / 100;
        const cMul = (contrast - 100) * 0.01 + 1; // contrast multiplier
        const intercept = 128 * (1 - cMul);

        for (let i = 0; i < data.length; i += 4) {
          // Brightness & Contrast
          for (let c = 0; c < 3; c++) {
            let val = data[i + c] * bMul;
            val = val * cMul + intercept;
            data[i + c] = Math.max(0, Math.min(255, val));
          }
        }

        if (activeFilter === "grayscale") {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
          ctx.putImageData(imgData, 0, 0);
        } else if (activeFilter === "invert") {
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
          ctx.putImageData(imgData, 0, 0);
        } else if (activeFilter === "threshold") {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const binary = gray >= threshValue ? 255 : 0;
            data[i] = binary;
            data[i + 1] = binary;
            data[i + 2] = binary;
          }
          ctx.putImageData(imgData, 0, 0);
        } else if (activeFilter === "sobel") {
          // 1. Grayscale step inside sobel temp buffer
          const grayBuf = new Uint8Array(w * h);
          for (let i = 0; i < data.length; i += 4) {
            grayBuf[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          }

          // Sobel kernels
          const hKernel = [
            -1, 0, 1,
            -2, 0, 2,
            -1, 0, 1
          ];
          const vKernel = [
            -1, -2, -1,
             0,  0,  0,
             1,  2,  1
          ];

          const outputData = ctx.createImageData(w, h);
          const out = outputData.data;

          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              let sumX = 0;
              let sumY = 0;

              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const px = grayBuf[(y + ky) * w + (x + kx)];
                  const kIdx = (ky + 1) * 3 + (kx + 1);
                  sumX += px * hKernel[kIdx];
                  sumY += px * vKernel[kIdx];
                }
              }

              const magnitude = Math.min(255, Math.sqrt(sumX * sumX + sumY * sumY));
              const idx = (y * w + x) * 4;
              out[idx] = magnitude;     // R (Sobel glows white/cyan depending on styling)
              out[idx + 1] = magnitude * 0.9; // G
              out[idx + 2] = magnitude * 0.7; // B
              out[idx + 3] = 255;             // A
            }
          }
          
          // fill in borders
          ctx.putImageData(outputData, 0, 0);
        } else {
          ctx.putImageData(imgData, 0, 0);
        }
      } catch (err) {
        console.warn("Canvas restriction (likely CORS on cloud/remote assets). Displaying standard styled filters.");
      }
      setProcessing(false);
    };

    img.onerror = () => {
      setProcessing(false);
    };
  };

  const resetSliders = () => {
    setBrightness(100);
    setContrast(100);
    setThreshValue(128);
    setActiveFilter("sobel");
  };

  return (
    <div id="cv-sandbox-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Control Console */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-sans font-medium text-slate-100">GIS Preprocessing Controls</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 font-sans">
            Apply deep computer vision feature manipulation and convolutional filters mimicking active node tensor extractions before classifying.
          </p>

          {/* Quick Imagery Switcher */}
          <div className="mb-6">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Selected GIS Dataset</label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  id={`cv-preset-${preset.id}`}
                  key={preset.id}
                  onClick={() => onPresetSelect(preset)}
                  className={`text-xs p-2 text-left rounded-lg transition-all line-clamp-1 border ${
                    selectedPreset.id === preset.id && !customImage
                      ? "bg-slate-800 text-emerald-300 border-slate-700 font-medium"
                      : "bg-slate-950 text-slate-400 border-slate-900 hover:bg-slate-850 hover:text-slate-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enhancement Parameters */}
          <div className="space-y-5 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Filter Engine</span>
              {processing && <span className="text-[10px] font-mono text-emerald-400 animate-pulse">Filtering...</span>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "none", name: "Pass-Through" },
                { id: "grayscale", name: "Grayscale (Luma)" },
                { id: "sobel", name: "Sobel Gradient" },
                { id: "threshold", name: "Binarization" },
                { id: "invert", name: "Invert Matrix" }
              ].map((fi) => (
                <button
                  id={`filter-btn-${fi.id}`}
                  key={fi.id}
                  onClick={() => setActiveFilter(fi.id as any)}
                  className={`text-xs py-2 rounded-lg border transition-all ${
                    activeFilter === fi.id
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60 font-medium"
                      : "bg-slate-950 text-slate-400 border-slate-900 hover:bg-slate-850"
                  }`}
                >
                  {fi.name}
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 font-sans text-slate-300">
                    <Sun className="w-3 h-3 text-slate-400" /> Brightness Gain
                  </span>
                  <span className="font-mono text-emerald-400">{brightness}%</span>
                </div>
                <input
                  id="brightness-slider"
                  type="range"
                  min="50"
                  max="180"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 font-sans text-slate-300">
                    <Zap className="w-3 h-3 text-slate-400" /> Contrast Ratio
                  </span>
                  <span className="font-mono text-emerald-400">{contrast}%</span>
                </div>
                <input
                  id="contrast-slider"
                  type="range"
                  min="50"
                  max="180"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {activeFilter === "threshold" && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 font-sans text-slate-300">
                      <Activity className="w-3 h-3 text-slate-400" /> Decision Threshold
                    </span>
                    <span className="font-mono text-emerald-400">{threshValue} / 255</span>
                  </div>
                  <input
                    id="threshold-slider"
                    type="range"
                    min="20"
                    max="230"
                    value={threshValue}
                    onChange={(e) => setThreshValue(Number(e.target.value))}
                    className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          id="reset-cv-btn"
          onClick={resetSliders}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-950 hover:bg-slate-850 hover:text-slate-200 text-slate-400 border border-slate-800 hover:border-slate-700 transition-all font-sans text-sm rounded-lg"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Parameters
        </button>
      </div>

      {/* Interactive Imagery Workspace Canvas Pane */}
      <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[350px]">
          {/* Original View */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" /> Raw Raster Layer
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300 uppercase">
                {customImage ? "Custom Upload" : selectedPreset.groundTruth}
              </span>
            </div>
            <div className="flex-1 relative bg-slate-900 rounded-lg border border-slate-850 overflow-hidden flex items-center justify-center p-2 min-h-[250px]">
              <canvas ref={originalCanvasRef} className="max-w-full max-h-[350px] object-contain rounded shadow-lg" />
            </div>
          </div>

          {/* Processed View */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Feature Extraction Matrix
              </span>
              <span className="text-[10px] bg-emerald-950/30 border border-emerald-900/40 px-1.5 py-0.5 rounded font-mono text-emerald-400 uppercase">
                {activeFilter} Active
              </span>
            </div>
            <div className="flex-1 relative bg-slate-900 rounded-lg border border-slate-850 overflow-hidden flex items-center justify-center p-2 min-h-[250px]">
              <canvas ref={canvasRef} className="max-w-full max-h-[350px] object-contain rounded shadow-lg" />
            </div>
          </div>
        </div>

        {/* Explainability / Educational Overlay Footer */}
        <div className="mt-6 pt-4 border-t border-slate-900">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> Neural Network Explanation
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            {activeFilter === "sobel" && (
              "The Sobel convolutional operator applies horizontal and vertical derivative kernels on lighting contours to emphasize high-frequency edges. For GIS, this exposes linear asphalt edges, curb guidelines, and unpaved boundary breaks that a CNN leverages during classification."
            )}
            {activeFilter === "grayscale" && (
              "Grayscaling strips red-green-blue light coordinates down to singular luminance values, standardizing dataset contrast. Standard models receive grayscale arrays to reduce computational complexity and avoid season-based color bias (e.g., green fields vs. dry winter soil)."
            )}
            {activeFilter === "threshold" && (
              "Binarization filters simplify imagery to pure binary black/white channels based on light reflectance thresholds. This is a foundational remote sensing technique used to calculate binary segment masks, emphasizing asphalt vs. bright building roofs."
            )}
            {activeFilter === "none" && (
              "Standard 3-channel RGB pixel input representing visual spectrum satellite images. Useful when modern Vision Transformers (ViTs) require full RGB context values to detect subtle surface textures."
            )}
            {activeFilter === "invert" && (
              "Inverting numerical image matrices exposes hidden sub-surface shadow trends, which is particularly helpful for identifying rural ditches, gravel shoulder grooves, and deep unpaved rutting patterns."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
