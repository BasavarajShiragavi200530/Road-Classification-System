import React, { useState } from "react";
import { 
  Compass, Layers, Cpu, Database, Sliders, CheckCircle, HelpCircle, AlertCircle
} from "lucide-react";
import { GIS_PRESETS } from "./data";
import { GISImagePreset } from "./types";
import GisWorkspace from "./components/GisWorkspace";
import CVSandbox from "./components/CVSandbox";
import ModelTraining from "./components/ModelTraining";
import DatasetExplorer from "./components/DatasetExplorer";

export default function App() {
  const [activeTab, setActiveTab] = useState<"classify" | "sandbox" | "training" | "dataset">("classify");
  const [selectedPreset, setSelectedPreset] = useState<GISImagePreset>(GIS_PRESETS[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isTrained, setIsTrained] = useState<boolean>(false);

  const handlePresetSelectInApp = (preset: GISImagePreset) => {
    setSelectedPreset(preset);
    setCustomImage(null); // Clear custom upload to favor selected preset
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none selection:bg-emerald-505 selection:text-slate-950">
      
      {/* Dynamic Upper Information Hub Banner / Header */}
      <header className="border-b border-slate-900 bg-slate-950/45 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg justify-self-center shrink-0">
              <Compass className="w-5 h-5 animate-spin-slow text-slate-950" />
            </div>
            <div>
              <h1 className="text-md sm:text-lg font-semibold tracking-tight text-slate-105 font-sans leading-none flex items-center gap-2">
                Road Classification System <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 font-mono py-0.5 px-1.5 rounded uppercase">GIS-ML Lab</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-sans mt-1">Satellite remote-sensing road type classification & feature extraction platform</p>
            </div>
          </div>

          {/* Quick status displays */}
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              <span className="text-slate-400 uppercase">Status:</span>
              <span className="text-slate-200 uppercase font-bold">Online</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg">
              <span className={`w-2 h-2 rounded-full inline-block ${isTrained ? "bg-emerald-400" : "bg-indigo-400"}`}></span>
              <span className="text-slate-400 uppercase">Inference weights:</span>
              <span className="text-slate-200 uppercase font-bold">{isTrained ? "Custom-CNN" : "Standard-Base"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs list Navigation bar */}
      <div className="bg-slate-950 border-b border-slate-900/80 sticky top-[73px] z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-3" aria-label="Tabs" id="applet-sub-navigation">
            {[
              { id: "classify", label: "Inference Workspace", icon: Compass },
              { id: "sandbox", label: "CV Preprocessing Previews", icon: Sliders },
              { id: "training", label: "CNN Model Trainer Sandbox", icon: Cpu },
              { id: "dataset", label: "Collected GIS Library", icon: Database }
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  id={`tab-nav-${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all border ${
                    isActive 
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/60 font-semibold" 
                      : "text-slate-400 bg-transparent border-transparent hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Workspace Frame container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Dynamic tabs mount */}
        <div className="relative">
          {activeTab === "classify" && (
            <GisWorkspace 
              presets={GIS_PRESETS}
              selectedPreset={selectedPreset}
              onPresetSelect={handlePresetSelectInApp}
              customImage={customImage}
              onCustomImageChange={setCustomImage}
              isTrained={isTrained}
            />
          )}

          {activeTab === "sandbox" && (
            <CVSandbox 
              presets={GIS_PRESETS}
              selectedPreset={selectedPreset}
              onPresetSelect={handlePresetSelectInApp}
              customImage={customImage}
            />
          )}

          {activeTab === "training" && (
            <ModelTraining 
              isTrained={isTrained}
              onTrainedStateChange={setIsTrained}
            />
          )}

          {activeTab === "dataset" && (
            <DatasetExplorer 
              presets={GIS_PRESETS}
              onPresetSelect={(preset) => {
                handlePresetSelectInApp(preset);
                setActiveTab("classify"); // Auto route back to workstation on selection
              }}
            />
          )}
        </div>
      </main>

      {/* Professional Footer Bar */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-[10px] font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 GIS Remote Sensing and Applied Machine Learning Lab. All rights resampled.</p>
          <div className="flex gap-4">
            <span>Lat: EPSG 4326 Ortho WGS84</span>
            <span>Raster Core: Web-GL v2.0 Acceleration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
