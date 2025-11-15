export const ERROR_MESSAGES = {

  /* ----------------------------- AUTHENTICATION ----------------------------- */
  NO_AUTH_TOKEN_FOUND: 'No auth token found.',
  AUTHENICATION__FAILED: 'Authentication failed.',
  INVALID_CREDENTIALS: 'Invalid Credentials',
  SESSION_EXPIRED: 'Session Expired. Please Login Again.',
  FAILED_REFRESH_TOKEN: 'Failed to refresh access token: ',
  LOGIN_ERROR: 'Login Error',
  LOGIN_SUCCESS: 'Login Success',
  PLEASE_WAIT: "Please wait",
  SOMETHING_WRONG: 'Something Went Wrong !',
  LOGOUT_FAILED: 'Logout Failed !',

  /* -------------------------------- PASSWORD -------------------------------- */
  FAILED_TO_UPDATE_PASSWORD: 'Failed to update password.',
  INVALID_PASSWORD_REGX: 'Invalid password regex in .env:',
  INCORRECT_CURRENT: "Incorrect Current Password",
  MUST_MATCH: "Passwords must match",
  FORCE_PASSWORD_CHANGE: "Force Password Change Success",
  PASSWORD_CHANGE: 'Password Change Successfully',

  /* ---------------------------------- OTP ----------------------------------- */
  INAVLID_OTP: "Invalid OTP",
  OPT_FORMAT: (formatted: string) =>
    `You can request a new OTP in ${formatted} second(s)`,

  /* ---------------------------- AUTH / DASHBOARD ----------------------------- */
  DASHBOARD_REDIRECTING: "Redirecting to dashboard...",

  /* ------------------------------- FILE ERRORS ------------------------------- */
  FILE_DOWNLOAD_FAILED: 'File download failed.',
  FAILED_TO_DOWNLOAD: 'Failed to download.',
  FAILED_TO_FETCH_FILE: 'Failed to fetch file.',
  DOWNLOAD_FAILED: 'Download failed',
  FILE_LARGE: 'File too large',
  MAX_FILE_SIZE: 'Maximum file size is 2MB',
  FILE_TOO_LAREG: (fileSize: string) =>
    `File is too large. Max size is ${fileSize} KB.`,
  FILE_NOT_ACCEPT: 'File not accepted.',
  FAILED_UPLOAD_FILE: 'Fail to upload file',
  MISSING_FILE: 'Missing File',
  ERROR_DELETING_FILE: 'Error deleting file:',
  FAILED_DELETED_IMAGE: 'Failed to delete image.',
  PROFILE_PICTURE_REMOVE: "Profile picture removed.",
  FILE_UPLOAD: 'File Uploaded',
  FILE_UPLOAD_SUCCESSFULLY: 'File Uploaded Successfully',

  /* ------------------------------- USER / ENTITY ------------------------------ */
  NO_ENTITY_SELECTED: 'No entity selected.',
  FAILED_UPDATED_PROFILE: 'Failed to update profile',
  ENTITY_FAILED: 'Failed to create Entity:',
  ENTITY_DELETE: 'Entity deleted successfully',
  RECORD_DELETE: 'Records deleted successfully',
  MODEL_DELETE: 'Model Deleted',
  MODEL_DELETE_SUCCESSFULLY: (modelName: string) =>
    `Model ${modelName} has been deleted successfully`,
  DELETE_FAIELD: "Delete Failed",
  EMAIL_ALREADY_TAKEN: 'Email is already taken,',
  UPDATED: 'Updated',
  SETTING_UPDATED: 'Settings updated',

  /* ---------------------------- RELATION & FILTER ---------------------------- */
  INVALID_FILTER_STRUCTURE: 'Invalid filter structure.',
  INVALID_RELATION_TYPE: (relationType: string, fieldName: string) =>
    `Invalid relationType ${relationType} on field ${fieldName}`,
  INVALID_JSON_WHERECLAUSE: 'Invalid whereClause JSON:',
  FIXED_FILTER_NOT_APPLIED: 'Fixed filter not applied due to parsing issues or invalid data.',
  SELECT_RELEVANT_FIELD: 'Please select relevant fields used in fixed filter',
  SKIPPING_EMPTY_FIXED_FILTER: 'Skipping invalid/empty fixed filter : ',
  FIELD_NOT_SELECT: 'Fields Not selected!',
  FIELD_NOT_IN_METADATA: (label: string) =>
    `${label} is not present in metadata`,
  SAVE_FILTER_UNDEFINED_NULL: 'Saved filter ID is undefined or null.',

  /* -------------------------------- FORM / UI -------------------------------- */
  FAILED_UPDATE_FROM: "Failed to update the form.",
  UPDATING_STEPPER: 'Error updating stepper : ',
  DYNAMIC_FUNCTION_ERROR: 'Error in DynamicFunctionComponent : ',
  ON_FORM_LOAD: 'Error in onFormLoad handler:',
  UNABLE_LOAD_DYNAMIC_MODULE: 'Unable to load dynamic module: ',
  LOADING_COMPONENT: 'Error loading component',

  /* ------------------------------ INTERACTIONS ------------------------------ */
  INTERATCTION_MESSGAE: (message: string, err: any) =>
    `Error handling interaction.message: ${message || String(err)}`,
  APPLY_FAILED: 'Apply Failed',
  APPLY_SUCCESS: 'Apply Successful',
  PREVIEW_INTERACTION: 'Preview clicked for interaction:',
  FAILED_APPLY_INTERACTION: (error: string) =>
    `Failed to apply interaction - ${error}`,

  /* --------------------------- PROCESS / BACKEND ---------------------------- */
  BACKEND_UNAVAILABLE: 'Backend Unavailable',
  SEEDER_NOT_TRIGGERED: 'Seeder not triggered. Could not reach backend.',
  IS_SEEDER_ERROR: 'isSeederError',
  IS_SEEDER_SUCCESS: 'isSeederSuccess',
  SEEDER_ERROR: 'Seeder Error',
  SEEDER_NOT_RUN: 'Could not run seeder. Please try again.',
  BACKEND_NOT_ALIVE: 'Backend is not alive, cannot run seeder',
  FAILED_TRIGGER_MCP_CLIENT_JOB: 'Failed to trigger MCP client job',

  /* --------------------------------- NETWORK --------------------------------- */
  API_ERROR: 'API error: ',
  ERROR_OCCURED: "An error occurred",
  FETCHING_MESSAGE: 'Error fetching messages:',
  FETCHING_USER: 'Error fetching users:',
  FETCHING_ITEMS: 'Error fetching items',
  LOAD_MORE_DATA: 'Failed to load more data:',
  NETWORK_ERROR : 'Network error occurred. Please try again.',
  NETWORK_OR_SERVER_ERROR : 'Network or server error occurred.',
  DELETE_ERROR : 'Delete error',

  /* ----------------------------- IMPORT / EXPORT ----------------------------- */
  IMPORT_ERROR: 'Import Error',
  EXPORT_SUCCESSFULLY: 'File Exported Successfully.',
  SEND_REPORT: 'Can you send me the report?',

  /* ----------------------------------- MISC ---------------------------------- */
  ERROR: 'Error',
  FAILED: 'Failed',
  IS_SUCCESS: 'Success',
  DELETED: 'Deleted',
  UPDATE_FAILED: 'Update failed',
  FAILED_CREATE_MENU: 'Failed to create menu',
  ORM_TYPE_REQUIRED: 'Orm Type is required!',
  ACTION_FUNCTION: (action: string) =>
    `Action function "${action}" not found.`,
  DUPLICATE_KEY: "Duplicate Key",
  ERROR_DECODING: 'Error decoding or parsing query string from local storage:',
  CREATE_MODEL: 'Failed to create Model',
  TEMPLATE_FAILED: 'Failed to create template',
  SELECT_FROMAT: 'Please Select Format',
  PARSED_FIELD: 'Failed to parse fields:',
  CODE_GENERTAE_SUCCESSFULLY: 'Code Generated Successfully',
  RESPONSE_GENERATE_CODE_HANDLER: "response generate code handler",
  KANBAN_UPDATED: "Kanban View Updated!",
  TRY_AGAIN: 'Please try again later',
  REMOVE_ROOT_NODE: "Cannot remove the root node.",
  ATTEMPT_FETCH_MESSAGE_STATUS: (queryString: string) =>
    `Attempting to fetch mq message status with query string: ${queryString}`,
  FAILED_FETCH_MESSAGE: "Failed to fetch MQ message status:",
  FAILED_CREATE_INVOICE: "Failed to create Invoice:",

  /* ----------------------------------- CRUD ---------------------------------- */
  ADD_ATLEAST_ONE_FIELD: "Please add at least one field",

};
