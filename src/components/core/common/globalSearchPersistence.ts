import { ERROR_MESSAGES } from "../../../constants/error-messages";

const decodeStoredFilterObject = (encodedQueryString: string | null) => {
  if (!encodedQueryString) return null;

  try {
    const decodedQueryString = atob(encodedQueryString);
    return JSON.parse(decodedQueryString);
  } catch (error) {
    console.error(ERROR_MESSAGES.ERROR_DECODING, error);
    return null;
  }
};


const hasMeaningfulPersistedFilterValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulPersistedFilterValue(item));
  if (typeof value === "object") return hasMeaningfulPersistedFilter(value);
  return false;
};

export const hasMeaningfulPersistedFilter = (filterObject: any): boolean => {
  if (!filterObject || typeof filterObject !== "object") return false;

  if (Array.isArray(filterObject)) {
    return filterObject.some((item) => hasMeaningfulPersistedFilter(item) || hasMeaningfulPersistedFilterValue(item));
  }

  return Object.entries(filterObject).some(([key, value]) => {
    if (key === "matchMode" || key === "operator") return false;
    if (key === "value") return hasMeaningfulPersistedFilterValue(value);
    if ((key === "$and" || key === "$or") && Array.isArray(value)) {
      return value.some((item) => hasMeaningfulPersistedFilter(item) || hasMeaningfulPersistedFilterValue(item));
    }
    if (typeof value === "object") return hasMeaningfulPersistedFilter(value);
    return hasMeaningfulPersistedFilterValue(value);
  });
};

export const hasStoredFilterPredicates = (queryObject: any): boolean =>
  hasMeaningfulPersistedFilter(queryObject?.custom_filter_predicate) ||
  hasMeaningfulPersistedFilter(queryObject?.search_predicate) ||
  hasMeaningfulPersistedFilter(queryObject?.saved_filter_predicate) ||
  hasMeaningfulPersistedFilter(queryObject?.predefined_search_predicate);

// export const hasStoredSearchUiState = (queryObject: any): boolean =>
//   hasStoredFilterPredicates(queryObject) ||
//   Boolean(queryObject?.grouping_rules?.some?.((rule: any) => rule?.fieldName !== null)) ||
//   Boolean(queryObject?.aggregation_rules?.some?.((rule: any) => Boolean(rule?.fieldName)));

export const getFilterObjectFromLocalStorage = () => {
  const currentPageUrl = window.location.pathname;
  if (!currentPageUrl || typeof window === "undefined") return null;
  return decodeStoredFilterObject(localStorage.getItem(currentPageUrl));
};

export const getFilterObjectFromLocalStorageByUrl = (url: string) => {
  if (typeof window === "undefined") return null;
  return decodeStoredFilterObject(localStorage.getItem(url));
};

export const setFilterObjectToLocalStorage = (queryObject: any) => {
  if (typeof window === "undefined" || !queryObject) return null;

  const stringifiedObject = JSON.stringify(queryObject);
  const encodedQueryString = btoa(stringifiedObject);
  const currentPageUrl = window.location.pathname;
  localStorage.setItem(currentPageUrl, encodedQueryString);
  return encodedQueryString;
};

export const setFilterObjectToLocalStorageByUrl = (url: string, queryObject: any) => {
  if (typeof window === "undefined" || !queryObject) return null;

  const stringifiedObject = JSON.stringify(queryObject);
  const encodedQueryString = btoa(stringifiedObject);
  localStorage.setItem(url, encodedQueryString);
  return encodedQueryString;
};

export const clearFilterObjectFromLocalStorage = () => {
  const currentPageUrl = window.location.pathname;
  if (!currentPageUrl || typeof window === "undefined") return;

  localStorage.removeItem(currentPageUrl);
};

export const clearFilterObjectFromLocalStorageByUrl = (url: string) => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(url);
};
