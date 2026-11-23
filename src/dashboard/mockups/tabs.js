// A tab can be bulk-rendered once it has a photo, a print box and a design.
export const isReady = (tab) => Boolean(tab.photo && tab.placement.quad && tab.designs.length);
