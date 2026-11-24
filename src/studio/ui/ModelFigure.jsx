// A flat illustration of a model in an oversized tee, standing in for photos
// until real model sets exist. Solid colours only. Shows the angle, the tee
// colour and where a print sits.
const BACK = new Set(["back", "rear_45"]);
const ZONES = { FR: [78, 98, 44, 52], LP: [108, 100, 16, 14], BK: [72, 94, 56, 72] };

const isDarkHex = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 110;
};

const TEE = "M70 78 Q100 70 130 78 L166 104 L156 128 L140 120 L142 192 H58 L60 120 L44 128 L34 104 Z";
const TEE_SIDE = "M78 78 Q100 70 122 78 L128 122 L118 124 L120 192 H80 L82 124 L72 122 Z";

const ModelFigure = ({ angle = "front", tee = "#00b140", skin = "#b07a55", hair = "#1b1410", print = null, className = "" }) => {
  const back = BACK.has(angle);
  const side = angle === "side";
  const turned = angle === "front_45" || angle === "rear_45";
  const closeup = angle === "closeup";
  const sx = side ? 0.62 : turned ? 0.84 : 1;
  const zone = print && !side && ZONES[print];
  const ink = isDarkHex(tee) ? "#f2efe9" : "#121212";

  return (
    <svg viewBox={closeup ? "40 34 120 140" : "0 0 200 260"} className={className} role="img" aria-label={`${angle.replace("_", " ")} view`} preserveAspectRatio="xMidYMid slice">
      {/* studio backdrop and floor */}
      <rect width="200" height="260" fill="#d6d3cc" />
      <rect y="214" width="200" height="46" fill="#cbc7bf" />
      <ellipse cx="100" cy="252" rx="40" ry="5" fill="#b9b5ac" />

      <g transform={`translate(${100 - 100 * sx} 0) scale(${sx} 1)`}>
        {/* legs, shoes, shorts */}
        <rect x="80" y="214" width="15" height="36" rx="6" fill={skin} />
        <rect x="105" y="214" width="15" height="36" rx="6" fill={skin} />
        <rect x="77" y="246" width="20" height="8" rx="4" fill="#f4f3ef" />
        <rect x="103" y="246" width="20" height="8" rx="4" fill="#f4f3ef" />
        <path d="M68 186 H132 L134 222 H104 L100 206 L96 222 H66 Z" fill="#b9a585" />
        {/* arms */}
        <rect x={side ? 92 : 34} y="114" width="14" height="66" rx="7" fill={skin} />
        {!side && <rect x="152" y="114" width="14" height="66" rx="7" fill={skin} />}
        {/* neck, head, hair */}
        <rect x="92" y="62" width="16" height="18" rx="6" fill={skin} />
        <ellipse cx="100" cy="48" rx="18" ry="21" fill={skin} />
        <path d={back ? "M82 46 Q82 24 100 24 Q118 24 118 46 Q118 62 100 64 Q82 62 82 46 Z" : "M82 44 Q83 24 100 24 Q117 24 118 44 Q112 34 100 34 Q88 34 82 44 Z"} fill={hair} />
        {/* tee: flat colour with one flat shadow panel for form */}
        <path d={side ? TEE_SIDE : TEE} fill={tee} />
        <path d={side ? "M108 80 L122 78 L128 122 L118 124 L120 192 H104 Z" : "M118 76 L130 78 L166 104 L156 128 L140 120 L142 192 H116 Z"} fill="#000" opacity="0.12" />
        {!back && !side && <path d="M90 76 Q100 86 110 76" stroke="#000" strokeOpacity="0.25" strokeWidth="2" fill="none" />}
        {/* print */}
        {zone && (
          <g>
            <rect x={zone[0]} y={zone[1]} width={zone[2]} height={zone[3]} rx="2" fill={ink} opacity="0.9" />
            {zone[2] > 30 && (
              <>
                <rect x={zone[0] + 6} y={zone[1] + 6} width={zone[2] - 12} height={zone[3] - 22} fill="#ff4f1a" />
                <rect x={zone[0] + 6} y={zone[1] + zone[3] - 11} width={zone[2] - 12} height="3" fill={tee} />
                <rect x={zone[0] + 6} y={zone[1] + zone[3] - 6} width={(zone[2] - 12) * 0.6} height="2" fill={tee} />
              </>
            )}
          </g>
        )}
      </g>
    </svg>
  );
};

export default ModelFigure;
