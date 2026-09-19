import { useMemo, useState, useEffect } from "react";

/** Turns the flat `Category[]` list (with parentId) into a nested tree. */
function buildTree(flat) {
  const byId = new Map(flat.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRec = (nodes) => {
    nodes.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

function Node({ node, depth, activeSlug, onSelect, expanded, toggle }) {
  const isOpen = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const isActive = node.slug === activeSlug;

  return (
    <div>
      <button
        onClick={() => (hasChildren ? toggle(node.id) : onSelect(node))}
        className={`group relative flex w-full items-center gap-2 rounded-lg py-2 pr-3 text-left text-sm font-medium transition-all duration-200 ${
          isActive 
            ? "bg-indigo-500/10 text-indigo-300 shadow-[inset_2px_0_0_0_#6366f1]" 
            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {/* Expand/Collapse Chevron for Folders */}
        <div className="flex w-4 items-center justify-center shrink-0">
          {hasChildren && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-90" : "rotate-0"}`}
            >
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Icons */}
        <div className={`flex items-center justify-center shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
          {!node.isProblem ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-start justify-center">
          <span className="truncate w-full text-left">{node.name}</span>
          {node.isProblem && node.createdAt && (
            <span className="text-[10px] text-slate-500 font-normal mt-0.5">
              {new Date(node.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")}
            </span>
          )}
        </div>
        
        {node._count?.problems > 0 && (
          <span className="ml-auto rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-400 ring-1 ring-inset ring-slate-700/50 shrink-0">
            {node._count.problems}
          </span>
        )}
      </button>

      {hasChildren && (
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          {node.children.map((child) => (
            <Node
              key={child.id}
              node={child}
              depth={depth + 1}
              activeSlug={activeSlug}
              onSelect={onSelect}
              expanded={expanded}
              toggle={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Folder Tree navigation for DSA categories (Arrays, Dynamic Programming, ...).
 * `categories` = flat array as returned by GET /api/categories.
 * `onSelect(node)` fires when a leaf (no children) is clicked.
 */
export default function FolderTree({ categories, activeSlug, onSelect }) {
  const tree = useMemo(() => buildTree(categories || []), [categories]);
  const [expanded, setExpanded] = useState(() => new Set());

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set();
      
      if (activeSlug) {
        const activeNode = (categories || []).find(c => c.slug === activeSlug && c.isProblem);
        if (activeNode) {
          let current = activeNode.parentId;
          while (current) {
            next.add(current);
            const parent = (categories || []).find(c => c.id === current);
            current = parent?.parentId;
          }
        }
      } else {
        // If no active problem, keep previously expanded state (or could reset entirely)
        return prev;
      }
      
      // Compare to avoid unnecessary re-renders
      if (next.size !== prev.size) return next;
      for (let id of next) {
        if (!prev.has(id)) return next;
      }
      
      return prev;
    });
  }, [activeSlug, categories]);

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <nav className="w-full shrink-0 p-1">
      <div className="px-2 py-2 mb-2 flex items-center justify-between border-b border-slate-800/50">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Categories
        </h3>
      </div>
      <div className="space-y-0.5">
        {tree.map((node) => (
          <Node
            key={node.id}
            node={node}
            depth={0}
            activeSlug={activeSlug}
            onSelect={onSelect}
            expanded={expanded}
            toggle={toggle}
          />
        ))}
      </div>
    </nav>
  );
}
