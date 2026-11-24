// A stylised model in an oversized tee, standing in for photos in the
// prototype. Shows the angle, the tee colour and where the print sits.
import { useId } from "react";
import { isDark } from "../data/sample";

const BACK = new Set(["back", "rear_45"]);

const ModelFigure = ({ angle = "front", tee = "#00b140", skin = "#b07a55", hair = "#1b1410", print = null, className = "" }) => {
  const uid = useId().replace(/:/g, "");
  const back = BACK.has(angle);
  const side = angle === "side";
  const turned = angle === "front_45" || angle === "rear_45";
  const closeup = angle === "closeup";
  const sx = side ? 0.62 : turned ? 0.84 : 1; // narrower body when turned
  const ink = isDark(tee) ? "#f5f5f7" : "#111113";
  const viewBox = closeup ? "40 34 120 140" : "0 0 200 260";

  // Print zone per placement, in front-view coordinates (squeezed with the body).
  const zones = { FR: [78, 98, 44, 52], LP: [108, 100, 16, 14], BK: [72, 94, 56, 72] };
  const zone = print && zones[print];

  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label={`${angle} view`}>
      <defs>
        <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a31" />
          <stop offset="1" stopColor="#16161b" />
        </linearGradient>
        <linearGradient id={`shade${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={`print${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="0.55" stopColor="#ff5c8a" />
          <stop offset="1" stopColor="#ffb547" />
        </linearGradient>
        <radialGradient id={`floor${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="200" height="260" fill={`url(#bg${uid})`} />
      <ellipse cx="100" cy="252" rx="46" ry="6" fill={`url(#floor${uid})`} />

      <g transform={`translate(${100 - 100 * sx} 0) scale(${sx} 1)`}>
        {/* legs */}
        <rect x="80" y="214" width="15" height="36" rx="6" fill={skin} />
        <rect x="105" y="214" width="15" height="36" rx="6" fill={skin} />
        <rect x="77" y="246" width="20" height="8" rx="4" fill="#ecebe6" />
        <rect x="103" y="246" width="20" height="8" rx="4" fill="#ecebe6" />
        {/* shorts */}
        <path d="M68 186 H132 L134 222 H104 L100 206 L96 222 H66 Z" fill="#b9a585" />
        {/* arms */}
        <rect x={side ? 92 : 34} y="114" width="14" height="66" rx="7" fill={skin} />
        {!side && <rect x="152" y="114" width="14" height="66" rx="7" fill={skin} />}
        {/* neck + head */}
        <rect x="92" y="62" width="16" height="18" rx="6" fill={skin} />
        <ellipse cx="100" cy="48" rx="18" ry="21" fill={skin} />
        <path
          d={back ? "M82 46 Q82 24 100 24 Q118 24 118 46 Q118 62 100 64 Q82 62 82 46 Z" : "M82 44 Q83 24 100 24 Q117 24 118 44 Q112 34 100 34 Q88 34 82 44 Z"}
          fill={hair}
        />
        {/* oversized tee with dropped shoulders */}
        <path
          d={side ? "M78 78 Q100 70 122 78 L128 122 L118 124 L120 192 H80 L82 124 L72 122 Z" : "M70 78 Q100 70 130 78 L166 104 L156 128 L140 120 L142 192 H58 L60 120 L44 128 L34 104 Z"}
          fill={tee}
        />
        <path
          d={side ? "M78 78 Q100 70 122 78 L128 122 L118 124 L120 192 H80 L82 124 L72 122 Z" : "M70 78 Q100 70 130 78 L166 104 L156 128 L140 120 L142 192 H58 L60 120 L44 128 L34 104 Z"}
          fill={`url(#shade${uid})`}
        />
        {!back && !side && <path d="M90 76 Q100 86 110 76" stroke="rgba(0,0,0,0.25)" strokeWidth="2" fill="none" />}
        {/* print */}
        {zone && !side && (
          <g>
            <rect x={zone[0]} y={zone[1]} width={zone[2]} height={zone[3]} rx="3" fill={`url(#print${uid})`} opacity="0.92" />
            {zone[2] > 30 && (
              <>
                <rect x={zone[0] + 5} y={zone[1] + zone[3] - 12} width={zone[2] - 10} height="3" rx="1.5" fill={ink} opacity="0.85" />
                <rect x={zone[0] + 5} y={zone[1] + zone[3] - 7} width={(zone[2] - 10) * 0.6} height="2.5" rx="1.25" fill={ink} opacity="0.6" />
              </>
            )}
          </g>
        )}
      </g>
    </svg>
  );
};

export default ModelFigure;
