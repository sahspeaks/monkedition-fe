// One tab per model/colour photo. The dot turns green once the tab can be rendered.
import { Plus, X } from "lucide-react";
import { isReady } from "./tabs";

const TabBar = ({ tabs, activeKey, onSelect, onClose, onAdd }) => (
  <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Photos">
    {tabs.map((tab) => {
      const active = tab.key === activeKey;
      return (
        <div
          key={tab.key}
          className={`flex items-center gap-2 shrink-0 rounded-lg border pl-3 pr-1 py-1.5 text-sm ${active ? "border-orange-400 bg-white text-gray-900" : "border-gray-200 bg-gray-50 text-gray-600"}`}
        >
          <button type="button" role="tab" aria-selected={active} className="flex items-center gap-2" onClick={() => onSelect(tab.key)}>
            <span className={`h-2 w-2 rounded-full ${isReady(tab) ? "bg-green-500" : "bg-gray-300"}`} aria-hidden="true" />
            <span className="max-w-[12rem] truncate">{tab.name}</span>
            <span className="rounded bg-gray-100 px-1.5 text-xs text-gray-500" title="Designs in this tab">
              {tab.designs.length}
            </span>
          </button>
          <button type="button" className="rounded p-1 text-gray-400 hover:text-red-600" aria-label={`Close ${tab.name}`} onClick={() => onClose(tab.key)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    })}
    <button
      type="button"
      onClick={onAdd}
      className="flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-white"
    >
      <Plus className="h-4 w-4" /> New tab
    </button>
  </div>
);

export default TabBar;
