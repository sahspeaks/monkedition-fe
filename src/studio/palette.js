// The shop's colours (dashboard/colours.js, mirroring the backend) with what
// Studio needs on top: a FABRIC colour to recolour with, and a group.
//
// The shop's hex is a screen swatch (Black #000000); real dyed cotton is never
// that pure, so recolouring uses `fabric`. These are first estimates: match
// them to photos of the real Qikink blanks. Melange colours are recoloured as
// a flat shade; their speckle can't be simulated.
import { COLOURS } from "../dashboard/colours";

const FABRIC = {
  Bk: "#18181A", Wh: "#F1F0EC", Yl: "#E8C23A", BB: "#A9C8E8", SG: "#8E959C", Sb: "#6FB4DE",
  Rb: "#2F4FA2", Rd: "#B3242B", Pu: "#6A3E8E", pb: "#1F5466", Ph: "#F2C9A8", or: "#E2672A",
  OG: "#55613A", NYI: "#E3E35A", Nb: "#1F2A44", MYI: "#D39B26", Mh: "#8A6F5C", Mnt: "#BFE3D0",
  Mn: "#5C1F2A", LBp: "#F2C9D3", Lv: "#C7B8E0", Jd: "#2E9E7E", Gm: "#B8B8B6", GYI: "#E5A425",
  Fgn: "#2E7D45", Cor: "#EE8A78", Cop: "#B8692F", bn: "#4A3326", Cm: "#45474B", BRd: "#9C3329",
  Gn: "#1E4D36", Be: "#D9C9A8", Fl: "#E36B9A",
};

/** Relative luminance 0..1 (sRGB). */
export const luminance = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};

/** Dark garments use the design's dark-tee version by default. */
export const isDarkFabric = (hex) => luminance(hex) < 0.12;

const groupOf = (hex) => {
  const l = luminance(hex);
  if (l < 0.12) return "Darks";
  if (l > 0.55) return "Lights";
  return "Mids";
};

export const PALETTE = COLOURS.map((c) => {
  const fabric = FABRIC[c.code] ?? c.hex;
  return { ...c, fabric, group: groupOf(fabric) };
});
export const GROUPS = ["Darks", "Mids", "Lights"];
export const colourOf = (code) => PALETTE.find((c) => c.code === code) ?? null;
