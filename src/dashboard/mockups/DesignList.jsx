// A tab's designs. Click one to preview it; ★ marks a design with its own box.
import { X } from "lucide-react";

const DesignList = ({ designs, previewId, overrides, onPreview, onRemove }) => {
  if (!designs.length) return null;
  const firstIndexOf = {};
  return (
    <ul className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
      {designs.map((design, i) => {
        const sameAs = firstIndexOf[design.name];
        firstIndexOf[design.name] ??= i + 1;
        const active = design.id === previewId;
        return (
          <li key={design.id} className={`flex items-center gap-2 px-2 py-1.5 text-xs ${active ? "bg-orange-50" : "hover:bg-gray-50"}`}>
            <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onPreview(design.id)} aria-pressed={active}>
              <span className="w-5 text-gray-400">{String(i + 1).padStart(2, "0")}</span>
              <img src={design.thumb} alt="" className="h-8 w-8 rounded bg-gray-200 object-contain" />
              <span className={`truncate ${active ? "text-gray-900 font-medium" : "text-gray-600"}`}>{design.name}</span>
            </button>
            {sameAs && (
              <span className="shrink-0 text-orange-700" title={`Same file name as #${sameAs}; output files are numbered so both are kept`}>
                same as #{sameAs}
              </span>
            )}
            {overrides[design.id] && (
              <span className="shrink-0 text-orange-700" title="Has its own box in this tab">
                ★ custom
              </span>
            )}
            {design.code && <span className="shrink-0 rounded bg-gray-100 px-1.5 text-gray-600">{design.code}</span>}
            <button type="button" className="shrink-0 rounded p-1 text-gray-400 hover:text-red-600" aria-label={`Remove ${design.name}`} onClick={() => onRemove(design.id)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default DesignList;
