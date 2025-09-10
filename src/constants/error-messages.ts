export const ERROR_MESSAGES = {
    // authentication errors
    // filter errors
    INVALID_FILTER_STRUCTURE: 'Invalid filter structure.',
    NO_AUTH_TOKEN_FOUND: 'No auth token found.',

    FILE_DOWNLOAD_FAILED: 'File download failed.',
    FAILED_TO_DOWNLOAD: 'Failed to download.',
    FAILED_TO_FETCH_FILE: 'Failed to fetch file.',

    NO_ENTITY_SELECTED: 'No entity selected.',
    FAILED_TO_UPDATE_PASSWORD: 'Failed to update password.',
    
    INVALID_RELATION_TYPE: (relationType: string, fieldName: string) =>
      `Invalid relationType ${relationType} on field ${fieldName}`,

    
  };
  