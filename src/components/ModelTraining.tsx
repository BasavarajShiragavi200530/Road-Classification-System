import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Sliders, Cpu, Activity, ListOrdered, CheckSquare, Terminal as TermIcon, AlertCircle } from "lucide-react";
import { Hyperparameters, TrainingMetricPoint, TermLog, ClassMetrics } from "../types";
import { DEFAULT_HYPERPARAMETERS, MOCK_REPORT_METRICS, MOCK_CONFUSION_MATRIX } from "../data";

interface ModelTrainingProps {
  onTrainedStateChange: (trained: boolean) => void;
  isTrained: boolean;
}

export default function ModelTraining({ onTrainedStateChange, isTrained }: ModelTrainingProps) {
  const [params, setParams] = useState<Hyperparameters>(DEFAULT_HYPERPARAMETERS);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [history, setHistory] = useState<TrainingMetricPoint[]>([]);
  const [logs, setLogs] = useState<TermLog[]>([]);
  const [activeMetricTab, setActiveMetricTab] = useState<"accuracy" | "loss">("accuracy");
  const [hoveredMatrixCell, setHoveredMatrixCell] = useState<{ row: string; col: string; val: number } | null>(null);

  const terminalRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll terminal on logs change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (text: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const newLog: TermLog = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      timestamp: new Date().toLocaleTimeString(),
      type
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleStartTraining = () => {
    setIsTraining(true);
    onTrainedStateChange(false);
    setCurrentEpoch(0);
    setHistory([]);
    setLogs([]);

    addLog(`Initializing GIS tensor pipeline model: ${params.modelType}...`, "info");
    addLog(`Hyperparameters: LR=${params.learningRate}, BatchSize=${params.batchSize}, Optimizer=${params.optimizer}, Dropout=${params.dropout}`, "info");
    addLog("Loading GIS multi-spectral training coordinates and aerial raster segments...", "info");
    addLog("Segmenting datasets: Train/Val split (80% / 20%). Total imagery count configured: 645 samples.", "success");

    let step = 0;
    const totalEpochs = params.epochs;
    let currentHistory: TrainingMetricPoint[] = [];

    // Simulate training curves dynamically with slight stochastic noise
    const interval = setInterval(() => {
      step++;
      
      // We simulate epochs
      if (step <= totalEpochs) {
        setCurrentEpoch(step);
        
        // Formulate standard convergent learning curves
        // Accuracy rises converging to some asymptote, loss decreases
        const modelMaxAcc = params.modelType === "ResNet-50" ? 0.94 : params.modelType === "Vision Transformer (ViT)" ? 0.96 : params.modelType === "MobileNet-v3" ? 0.91 : 0.85;
        const optFactor = params.optimizer === "Adam" ? 1.0 : params.optimizer === "RMSprop" ? 0.95 : 0.88;
        const targetAcc = modelMaxAcc * optFactor;

        const progress = step / totalEpochs;
        const trainAcc = Math.min(0.99, 0.45 + (targetAcc - 0.45) * (1 - Math.exp(-3 * progress)) + (Math.random() - 0.5) * 0.02);
        const valAcc = Math.min(0.97, 0.42 + (targetAcc * 0.96 - 0.42) * (1 - Math.exp(-2.8 * progress)) + (Math.random() - 0.5) * 0.03);

        const trainLoss = Math.max(0.05, 1.8 * Math.exp(-2.5 * progress) + (Math.random() * 0.04));
        const valLoss = Math.max(0.08, 1.9 * Math.exp(-2.3 * progress) + (Math.random() * 0.05) + (step > totalEpochs * 0.8 ? (params.dropout < 0.2 ? 0.05 : 0) : 0)); // simple overfitting check

        const newMetric: TrainingMetricPoint = {
          epoch: step,
          loss: Number(trainLoss.toFixed(4)),
          valLoss: Number(valLoss.toFixed(4)),
          accuracy: Number(trainAcc.toFixed(4)),
          valAccuracy: Number(valAcc.toFixed(4))
        };

        currentHistory.push(newMetric);
        setHistory([...currentHistory]);

        addLog(`=== [Epoch ${step}/${totalEpochs}] ===`, "info");
        addLog(`Step 30/30 (Batch size ${params.batchSize}) complete. Forward/Backward propagation validated.`, "info");
        addLog(`loss: ${newMetric.loss} - accuracy: ${newMetric.accuracy} - val_loss: ${newMetric.valLoss} - val_accuracy: ${newMetric.valAccuracy}`, "success");

        if (step === Math.round(totalEpochs / 2)) {
          addLog(`Checkpoint saved at epoch ${step}. Validated learning weights gradient boundaries.`, "warning");
        }
      } else {
        clearInterval(interval);
        setIsTraining(false);
        onTrainedStateChange(true);
        addLog("-------------------------------------------------------------------------", "info");
        addLog(`CONVERGENCE ACHIEVED. System completed ${totalEpochs} epochs of training.`, "success");
        addLog(`Final Validation Accuracy: ${(currentHistory[currentHistory.length - 1].valAccuracy * 100).toFixed(2)}%`, "success");
        addLog(`Exported model weights saved to system node storage for remote classification inference.`, "info");
      }
    }, 1200);
  };

  // Render SVG charts custom helper
  const renderSVGChart = (type: "accuracy" | "loss") => {
    if (history.length === 0) return null;

    const width = 500;
    const height = 220;
    const padding = 40;

    const xMax = params.epochs;
    const yMax = type === "accuracy" ? 1.0 : 2.0;
    const yMin = 0;

    const getX = (epoch: number) => padding + ((epoch - 1) / (xMax - 1)) * (width - padding * 2 || 1);
    const getY = (val: number) => height - padding - ((val - yMin) / (yMax - yMin)) * (height - padding * 2);

    let trainPointsPath = "";
    let valPointsPath = "";

    history.forEach((pt, idx) => {
      const x = getX(pt.epoch);
      const yTrain = getY(type === "accuracy" ? pt.accuracy : pt.loss);
      const yVal = getY(type === "accuracy" ? pt.valAccuracy : pt.valLoss);

      if (idx === 0) {
        trainPointsPath = `M ${x} ${yTrain}`;
        valPointsPath = `M ${x} ${yVal}`;
      } else {
        trainPointsPath += ` L ${x} ${yTrain}`;
        valPointsPath += ` L ${x} ${yVal}`;
      }
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-slate-400">
        {/* Grids and Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#334155" strokeWidth="1" />

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((tick, i) => {
          const val = type === "accuracy" ? tick : tick * 2;
          const y = getY(val);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
              <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] font-mono fill-slate-500">
                {val.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* X axis ticks */}
        {Array.from({ length: Math.min(10, xMax) }).map((_, i) => {
          const epoch = Math.round((i / (Math.min(10, xMax) - 1)) * (xMax - 1)) + 1;
          const x = getX(epoch);
          return (
            <g key={i}>
              <line x1={x} y1={height - padding} x2={x} y2={height - padding + 5} stroke="#334155" />
              <text x={x} y={height - padding + 18} textAnchor="middle" className="text-[10px] font-mono fill-slate-500">
                E{epoch}
              </text>
            </g>
          );
        })}

        {/* Train Line */}
        <path d={trainPointsPath} fill="none" stroke={type === "accuracy" ? "#34d399" : "#f87171"} strokeWidth="2.5" className="transition-all duration-300" />
        {/* Val Line */}
        <path d={valPointsPath} fill="none" stroke={type === "accuracy" ? "#38bdf8" : "#fbbf24"} strokeWidth="2" strokeDasharray="4 2" className="transition-all duration-300" />

        {/* Intersect Dots */}
        {history.map((pt, i) => {
          if (i === history.length - 1 || i % Math.max(1, Math.round(params.epochs / 5)) === 0) {
            const x = getX(pt.epoch);
            const yTrain = getY(type === "accuracy" ? pt.accuracy : pt.loss);
            const yVal = getY(type === "accuracy" ? pt.valAccuracy : pt.valLoss);
            return (
              <g key={i}>
                <circle cx={x} cy={yTrain} r="4" className={type === "accuracy" ? "fill-emerald-400" : "fill-red-400"} />
                <circle cx={x} cy={yVal} r="3" className={type === "accuracy" ? "fill-sky-400" : "fill-amber-400"} />
              </g>
            );
          }
          return null;
        })}
      </svg>
    );
  };

  const roadTypes = Object.keys(MOCK_REF_MATRIX) as string[];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="training-playground-tab">
      {/* Hyperparameter Adjustments Area */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-sans font-medium text-slate-100">CNN Training Setup</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6 font-sans">
            Fine-tune Deep Convolutional Neural Network (CNN) parameters & evaluate test scores dynamically.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Model Architecture</label>
              <select
                id="model-type-select"
                value={params.modelType}
                onChange={e => setParams(prev => ({ ...prev, modelType: e.target.value as any }))}
                disabled={isTraining}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:border-emerald-500"
              >
                <option value="Custom CNN (5-Layer)">Custom CNN (5 convolutional layers)</option>
                <option value="ResNet-50">ResNet-50 (Deep Residual System)</option>
                <option value="MobileNet-v3">MobileNet-v3 (Efficient Edge Node)</option>
                <option value="Vision Transformer (ViT)">Vision Transformer (ViT-Base/16)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Optimizer Strategy</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Adam", "SGD", "RMSprop"] as const).map(opt => (
                  <button
                    id={`opt-btn-${opt}`}
                    key={opt}
                    onClick={() => setParams(prev => ({ ...prev, optimizer: opt }))}
                    disabled={isTraining}
                    className={`text-xs py-2 rounded-lg border transition-all ${
                      params.optimizer === opt
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60 font-medium"
                        : "bg-slate-950 text-slate-400 border-slate-900 hover:bg-slate-850 disabled:opacity-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Hyperparameter Inputs */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5">Learning Rate</label>
                  <select
                    id="lr-select"
                    value={params.learningRate}
                    onChange={e => setParams(prev => ({ ...prev, learningRate: Number(e.target.value) }))}
                    disabled={isTraining}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    <option value={0.1}>0.1 (High Speed)</option>
                    <option value={0.01}>0.01 (Moderate)</option>
                    <option value={0.001}>0.001 (Recommended)</option>
                    <option value={0.0001}>0.0001 (Conservative)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5">Batch Size</label>
                  <select
                    id="batch-size-select"
                    value={params.batchSize}
                    onChange={e => setParams(prev => ({ ...prev, batchSize: Number(e.target.value) }))}
                    disabled={isTraining}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    <option value={16}>16 (Low Memory)</option>
                    <option value={32}>32 (Standard)</option>
                    <option value={64}>64 (Parallel Engine)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono text-slate-400">Epoch Count</span>
                    <span className="font-mono text-emerald-400">{params.epochs}</span>
                  </div>
                  <input
                    id="epochs-slider font-mono"
                    type="range"
                    min="5"
                    max="25"
                    step="5"
                    disabled={isTraining}
                    value={params.epochs}
                    onChange={e => setParams(prev => ({ ...prev, epochs: Number(e.target.value) }))}
                    className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono text-slate-400">Dropout Rate</span>
                    <span className="font-mono text-emerald-400">{params.dropout}</span>
                  </div>
                  <input
                    id="dropout-slider"
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.1"
                    disabled={isTraining}
                    value={params.dropout}
                    onChange={e => setParams(prev => ({ ...prev, dropout: Number(e.target.value) }))}
                    className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-850">
          <button
            id="start-training-btn"
            onClick={handleStartTraining}
            disabled={isTraining}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.01] text-slate-950 font-sans font-medium text-sm rounded-lg transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isTraining ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                Fitting Epoch {currentEpoch}/{params.epochs}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Initialize Model Fitting
              </>
            )}
          </button>
        </div>
      </div>

      {/* Train Analytics Graphs / Console */}
      <div className="xl:col-span-8 space-y-6">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-sans font-medium text-slate-200">Real-Time Fitting Curves</h3>
            </div>

            <div className="flex gap-2">
              <button
                id="metric-acc-tab"
                onClick={() => setActiveMetricTab("accuracy")}
                className={`text-xs px-3 py-1 rounded font-mono ${
                  activeMetricTab === "accuracy" ? "bg-emerald-950 text-emerald-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Accuracy
              </button>
              <button
                id="metric-loss-tab"
                onClick={() => setActiveMetricTab("loss")}
                className={`text-xs px-3 py-1 rounded font-mono ${
                  activeMetricTab === "loss" ? "bg-rose-950 text-rose-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Cross-Entropy Loss
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* SVG Plot space */}
            <div className="lg:col-span-7 aspect-[2.1/1] bg-slate-900/40 rounded-xl border border-slate-900 p-4 flex items-center justify-center">
              {history.length > 0 ? (
                renderSVGChart(activeMetricTab)
              ) : (
                <div className="text-center p-6">
                  <Cpu className="w-8 h-8 text-slate-750 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs text-slate-550 font-mono">GRADIENT STACK WAITING FOR CALIBRATION PROCESS</p>
                </div>
              )}
            </div>

            {/* Current Epoch Indicator */}
            <div className="lg:col-span-5 h-full flex flex-col justify-center space-y-4">
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Training Convergence</p>
                  <p id="curr-epoch" className="text-2xl font-mono text-slate-100">
                    {currentEpoch} <span className="text-xs text-slate-500">/ {params.epochs} Epochs</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center">
                  <span className="text-xs font-mono text-emerald-400">{isTraining ? "LIVE" : "IDLE"}</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-sans text-slate-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Training Accuracy
                  </span>
                  <span className="font-mono text-slate-200">
                    {history.length > 0 ? `${(history[history.length - 1].accuracy * 100).toFixed(1)}%` : "0.0%"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-sans text-slate-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-450 inline-block"></span> Validation Accuracy
                  </span>
                  <span className="font-mono text-slate-200">
                    {history.length > 0 ? `${(history[history.length - 1].valAccuracy * 100).toFixed(1)}%` : "0.0%"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-850">
                  <span className="font-sans text-slate-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span> Train Loss
                  </span>
                  <span className="font-mono text-slate-200">
                    {history.length > 0 ? history[history.length - 1].loss : "0.000"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Terminal Console Logs */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-900/60 px-4 py-2 flex items-center justify-between border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <TermIcon className="w-3.5 h-3.5 text-emerald-500" /> Training Terminal Output
            </span>
            <span className="text-[10px] bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-500">
              STD_OUT / LOGS
            </span>
          </div>
          <div
            ref={terminalRef}
            className="h-44 overflow-y-auto bg-slate-950 p-4 font-mono text-xs text-slate-400 space-y-1.5 scrollbar-thin"
          >
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`leading-relaxed ${
                      log.type === "success"
                        ? "text-emerald-400"
                        : log.type === "warning"
                        ? "text-amber-400"
                        : log.type === "error"
                        ? "text-rose-450"
                        : "text-slate-300"
                    }`}
                  >
                    {log.text}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-600 flex items-center gap-1.5 h-full justify-center">
                <AlertCircle className="w-4 h-4" />
                Terminal idle. Click 'Initialize Model Fitting' to boot Tensor-Flow pipeline.
              </div>
            )}
          </div>
        </div>

        {/* Post-Training Evaluation Dashboard (F1 and Confusion Matrix) */}
        {(isTrained || history.length > 0) && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-sans font-medium text-slate-200">Model Evaluation Report (Val dataset)</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Classification Report */}
              <div className="lg:col-span-6 space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Classification Scores</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300 font-sans">
                    <thead>
                      <tr className="border-b border-slate-800 font-mono text-slate-500">
                        <th className="py-1">Class Label</th>
                        <th className="py-1 text-right">Precision</th>
                        <th className="py-1 text-right">Recall</th>
                        <th className="py-1 text-right font-medium text-slate-400">F1-Score</th>
                        <th className="py-1 text-right">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/45 font-mono">
                      {Object.entries(MOCK_REPORT_METRICS).map(([label, metrics]) => {
                        const m = metrics as ClassMetrics;
                        // dynamically adjust based on model selection
                        const scale = params.modelType === "ResNet-50" ? 1.02 : params.modelType === "Vision Transformer (ViT)" ? 1.04 : params.modelType === "MobileNet-v3" ? 0.98 : 0.92;
                        const p = Math.min(0.99, m.precision * scale);
                        const r = Math.min(0.99, m.recall * scale);
                        const f1 = (2 * p * r) / (p + r || 1);

                        return (
                          <tr key={label} className="hover:bg-slate-850/30">
                            <td className="py-2.5 font-sans font-medium text-slate-300">{label}</td>
                            <td className="py-2.5 text-right text-slate-400">{p.toFixed(2)}</td>
                            <td className="py-2.5 text-right text-slate-400">{r.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-semibold text-emerald-400">{f1.toFixed(2)}</td>
                            <td className="py-2.5 text-right text-slate-550">{m.support}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Confusion Matrix Heatmap</h4>
                  {hoveredMatrixCell && (
                    <span className="text-[10px] font-mono text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2 py-0.5 rounded">
                      True: {hoveredMatrixCell.row} | Pred: {hoveredMatrixCell.col} = {hoveredMatrixCell.val} samples
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
                  <div className="grid grid-cols-7 gap-1 text-[8px] font-mono leading-none">
                    {/* Corner Spacer */}
                    <div className="flex items-end justify-center text-[7px] text-slate-600 font-sans uppercase">True \ Pred</div>
                    
                    {/* Header Columns */}
                    {roadTypes.map(rt => (
                      <div key={rt} className="text-center truncate text-[7px] text-slate-500 py-1 uppercase" title={rt}>
                        {rt.split(" ")[0]}
                      </div>
                    ))}

                    {/* Matrix Rows */}
                    {roadTypes.map((rowLabel) => (
                      <React.Fragment key={rowLabel}>
                        <div className="truncate text-slate-400 font-sans py-2 pr-1 font-medium flex items-center justify-end" title={rowLabel}>
                          {rowLabel.split(" ")[0]}
                        </div>

                        {roadTypes.map((colLabel) => {
                          const val = MOCK_REF_MATRIX[rowLabel]?.[colLabel] || 0;
                          
                          // Determine heat intensity
                          const isDiagonal = rowLabel === colLabel;
                          const intensity = isDiagonal 
                            ? Math.min(100, Math.round((val / 140) * 100))
                            : Math.min(100, Math.round((val / 15) * 100));

                          let bgClass = "bg-slate-900 text-slate-600 hover:border-slate-500";
                          if (isDiagonal) {
                            bgClass = `bg-emerald-950 text-emerald-300 font-semibold border-emerald-900/60`;
                          } else if (val > 0) {
                            bgClass = `bg-rose-950 text-rose-300 border-rose-900/40`;
                          }

                          return (
                            <div
                              key={colLabel}
                              onMouseEnter={() => setHoveredMatrixCell({ row: rowLabel, col: colLabel, val })}
                              onMouseLeave={() => setHoveredMatrixCell(null)}
                              className={`aspect-square flex items-center justify-center rounded border border-transparent cursor-help transition-all duration-150 py-1 ${bgClass}`}
                              style={{
                                opacity: val > 0 ? 0.3 + intensity * 0.007 : 0.15
                              }}
                            >
                              {val}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-550 pt-2.5 font-mono border-t border-slate-900 mt-2">
                    <span>* Diagonal highlights correct predictions</span>
                    <span className="text-emerald-500">Peak diagonal confirms high recall</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Internal mock reference matrix for fast rendering safely without complex imports of dynamic metrics
const MOCK_REF_MATRIX: Record<string, Record<string, number>> = {
  "Highway": { "Highway": 103, "Paved Road": 5, "Unpaved Road": 0, "Gravel Road": 0, "Residential Road": 2, "Rural Road": 0 },
  "Paved Road": { "Highway": 3, "Paved Road": 140, "Unpaved Road": 1, "Gravel Road": 2, "Residential Road": 5, "Rural Road": 3 },
  "Unpaved Road": { "Highway": 0, "Paved Road": 1, "Unpaved Road": 68, "Gravel Road": 12, "Residential Road": 0, "Rural Road": 4 },
  "Gravel Road": { "Highway": 0, "Paved Road": 2, "Unpaved Road": 9, "Gravel Road": 83, "Residential Road": 0, "Rural Road": 2 },
  "Residential Road": { "Highway": 2, "Paved Road": 4, "Unpaved Road": 0, "Gravel Road": 0, "Residential Road": 124, "Rural Road": 2 },
  "Rural Road": { "Highway": 0, "Paved Road": 6, "Unpaved Road": 4, "Gravel Road": 8, "Residential Road": 3, "Rural Road": 99 }
};
