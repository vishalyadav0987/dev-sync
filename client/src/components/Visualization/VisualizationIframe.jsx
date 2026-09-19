import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export default function VisualizationIframe({ html, onStepChange, onReady, currentStep, isPlaying }) {
  const iframeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Send seek commands to iframe when currentStep changes
  useEffect(() => {
    if (!isReady || !iframeRef.current?.contentWindow) return;
    
    // Only send the step if we aren't currently receiving it from the iframe (to prevent infinite loops)
    iframeRef.current.contentWindow.postMessage({
      type: "SEEK",
      step: currentStep
    }, "*");
  }, [currentStep, isReady]);

  // Handle play/pause
  useEffect(() => {
    if (!isReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: isPlaying ? "PLAY" : "PAUSE"
    }, "*");
  }, [isPlaying, isReady]);

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (e) => {
      // For security in a real app, verify e.origin
      if (!e.data || !e.data.type) return;

      switch (e.data.type) {
        case "VISUALIZATION_READY":
          setIsReady(true);
          if (onReady && e.data.totalSteps) {
            onReady(e.data.totalSteps);
          }
          // Initial seek
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
              type: "SEEK",
              step: currentStep
            }, "*");
          }
          break;
        case "STEP_CHANGED":
          if (onStepChange && e.data.step !== undefined) {
            onStepChange(e.data.step);
          }
          break;
        case "CODE_LINE_CHANGED":
          // Handle highlighting code line logic here if needed
          break;
        case "SELECT_ELEMENT":
          // Handle element selection for notes
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onStepChange, currentStep]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Loading Visualization...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-none"
        title="Visualization Workspace"
        onLoad={() => {
          // If the iframe loaded (srcDoc is ready) and we missed the initial postMessage,
          // we can request the state or just mark it as ready.
          // To be safe, let's ask the iframe to send its state/ready message again.
          if (iframeRef.current?.contentWindow) {
             iframeRef.current.contentWindow.postMessage({ type: "REQUEST_STATE" }, "*");
             
             // As a fallback, just mark ready if we've loaded
             setTimeout(() => {
                setIsReady(true);
             }, 500);
          }
        }}
      />
    </div>
  );
}
