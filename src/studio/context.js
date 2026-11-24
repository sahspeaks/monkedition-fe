// Studio-wide state: drafts and the model library (sample data in the prototype).
import { createContext, useContext } from "react";

export const StudioContext = createContext(null);
export const useStudio = () => useContext(StudioContext);
