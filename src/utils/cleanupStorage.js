// Older versions kept product lists and page state in the browser. Nothing
// reads them now; this frees the space they took.
export const removeOldCaches = () => {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("products_")) localStorage.removeItem(key);
    }
    for (const key of ["collectionPageState", "collectionsData", "previousPath"]) {
      sessionStorage.removeItem(key);
    }
  } catch {
    /* storage can be blocked; there is nothing to clean then */
  }
};
