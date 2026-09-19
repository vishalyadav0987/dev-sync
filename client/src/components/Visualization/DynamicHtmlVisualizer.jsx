import { forwardRef } from "react";

const DynamicHtmlVisualizer = forwardRef(({ html }, ref) => {
  if (!html) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-500">
        <div className="text-center">
          <p className="mb-2">No visualization available for this problem.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-950">
      <iframe
        ref={ref}
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-none bg-white"
        title="Dynamic Visualization"
      />
    </div>
  );
});

export default DynamicHtmlVisualizer;
