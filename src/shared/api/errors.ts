export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  AUTH_TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  AUTH_RESET_TOKEN_INVALID: "This reset link is invalid. Request a new one.",
  AUTH_RESET_TOKEN_EXPIRED: "This reset link has expired. Request a new one.",
  TENANT_ACCESS_DENIED: "You do not have access to this organisation.",
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  PERMISSION_DENIED: "You do not have permission to perform this action.",
  RESOURCE_NOT_FOUND: "The requested record could not be found.",
  DUPLICATE_RESOURCE: "A record with these details already exists.",
  INVALID_STATUS_TRANSITION: "This action is not available for the current status.",
  INVENTORY_INSUFFICIENT_STOCK: "There is not enough stock to complete this action.",
  INSUFFICIENT_STOCK: "There is not enough stock to complete this action.",
  INTEGRATION_ERROR: "An external service is unavailable. Please try again later.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
  RATE_LIMITED: "Too many attempts. Please wait and try again.",
};

export const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function codeFrom(codeOrError: unknown): string | undefined {
  if (typeof codeOrError === "string") {
    return codeOrError;
  }
  if (isApiError(codeOrError)) {
    return codeOrError.code;
  }
  return undefined;
}

function detailsRecord(details: unknown): Record<string, unknown> | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return null;
  }
  return details as Record<string, unknown>;
}

function stringDetail(details: Record<string, unknown>, key: string): string | null {
  const value = details[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function appendDetailSentence(base: string, fragments: Array<string | null>): string {
  const parts = fragments.filter((part): part is string => Boolean(part));
  if (parts.length === 0) {
    return base;
  }
  return `${base.replace(/\.$/, "")}. ${parts.join(" ")}`;
}

function numberDetail(details: Record<string, unknown>, key: string): number | null {
  const value = details[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const GENERIC_VALIDATION_MESSAGES = new Set([
  ERROR_MESSAGES.VALIDATION_ERROR,
  "Request validation failed",
  "Validation failed",
]);

const VALIDATION_DETAIL_META_KEYS = new Set([
  "errors",
  "content_type",
  "max_upload_size_mb",
  "size_bytes",
  "max_bytes",
]);

function isUsefulValidationMessage(message: string): boolean {
  const trimmed = message.trim();
  return trimmed.length > 0 && !GENERIC_VALIDATION_MESSAGES.has(trimmed);
}

function firstErrorListMessage(details: Record<string, unknown>): string | null {
  const errors = details.errors;
  if (!Array.isArray(errors)) {
    return null;
  }
  for (const item of errors) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as { msg?: unknown; message?: unknown };
    const raw =
      typeof record.msg === "string"
        ? record.msg
        : typeof record.message === "string"
          ? record.message
          : null;
    if (raw && isUsefulValidationMessage(raw)) {
      return sanitizeValidationMessage(raw);
    }
  }
  return null;
}

export function apiErrorFromBody(
  code: string,
  status: number,
  message?: string | null,
  details?: unknown,
): ApiError {
  const trimmed = typeof message === "string" ? message.trim() : "";
  return new ApiError(code, trimmed || getErrorMessage(code), status, details);
}

export function getErrorMessage(codeOrError: unknown): string {
  const code = codeFrom(codeOrError);
  if (!code) {
    return FALLBACK_ERROR_MESSAGE;
  }
  const base = ERROR_MESSAGES[code] ?? FALLBACK_ERROR_MESSAGE;
  const details = isApiError(codeOrError) ? detailsRecord(codeOrError.details) : null;
  const serverMessage = isApiError(codeOrError) ? codeOrError.message.trim() : "";
  if (code === "VALIDATION_ERROR") {
    const maxMb = details ? numberDetail(details, "max_upload_size_mb") : null;
    if (maxMb != null) {
      return `Files must be ${maxMb} MB or smaller.`;
    }
    if (isUsefulValidationMessage(serverMessage)) {
      return serverMessage.endsWith(".") ? serverMessage : `${serverMessage}.`;
    }
    const contentType = details ? stringDetail(details, "content_type") : null;
    if (contentType) {
      return "This file type is not allowed.";
    }
    const listed = details ? firstErrorListMessage(details) : null;
    if (listed) {
      return listed.endsWith(".") ? listed : `${listed}.`;
    }
    const fieldMessages = Object.values(getValidationFieldErrors(codeOrError));
    if (fieldMessages.length === 1) {
      const only = fieldMessages[0];
      return only.endsWith(".") ? only : `${only}.`;
    }
    if (fieldMessages.length === 0 && details && Object.keys(details).length > 0) {
      return "This file could not be uploaded.";
    }
    return base;
  }
  if (!details) {
    return base;
  }
  if (code === "INVENTORY_INSUFFICIENT_STOCK" || code === "INSUFFICIENT_STOCK") {
    const availableRolls = stringDetail(details, "available_rolls");
    const availableKg = stringDetail(details, "available_kg");
    const requestedRolls = stringDetail(details, "requested_rolls");
    const requestedKg = stringDetail(details, "requested_kg");
    return appendDetailSentence(base, [
      availableRolls ? `Available rolls ${availableRolls}.` : null,
      availableKg ? `Available kg ${availableKg}.` : null,
      requestedRolls ? `Requested rolls ${requestedRolls}.` : null,
      requestedKg ? `Requested kg ${requestedKg}.` : null,
    ]);
  }
  return base;
}

export function isClientError(error: unknown): boolean {
  return isApiError(error) && error.status >= 400 && error.status < 500;
}

function fieldNameFromLoc(loc: unknown): string | null {
  if (!Array.isArray(loc)) {
    return null;
  }
  const parts = loc.filter(
    (part): part is string => typeof part === "string" && part !== "body" && part !== "query",
  );
  return parts.join(".") || null;
}

function sanitizeValidationMessage(message: string): string {
  return message.replace(/^Value error,\s*/i, "").trim();
}

export function getValidationFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error) || error.code !== "VALIDATION_ERROR" || error.details == null) {
    return {};
  }

  const fields: Record<string, string> = {};
  const details = error.details;

  if (Array.isArray(details)) {
    for (const item of details) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const record = item as { loc?: unknown; path?: unknown; msg?: unknown; message?: unknown };
      const name = fieldNameFromLoc(record.loc) ?? fieldNameFromLoc(record.path);
      const message =
        typeof record.msg === "string"
          ? record.msg
          : typeof record.message === "string"
            ? record.message
            : null;
      if (name && message) {
        fields[name] = sanitizeValidationMessage(message);
      }
    }
    return fields;
  }

  if (typeof details === "object") {
    const record = details as Record<string, unknown>;
    const nested = record.errors;
    if (Array.isArray(nested)) {
      for (const item of nested) {
        if (!item || typeof item !== "object") {
          continue;
        }
        const errorItem = item as {
          loc?: unknown;
          path?: unknown;
          msg?: unknown;
          message?: unknown;
        };
        const name = fieldNameFromLoc(errorItem.loc) ?? fieldNameFromLoc(errorItem.path);
        const message =
          typeof errorItem.msg === "string"
            ? errorItem.msg
            : typeof errorItem.message === "string"
              ? errorItem.message
              : null;
        if (name && message && !VALIDATION_DETAIL_META_KEYS.has(name)) {
          fields[name] = sanitizeValidationMessage(message);
        }
      }
    }
    for (const [key, value] of Object.entries(record)) {
      if (VALIDATION_DETAIL_META_KEYS.has(key) || typeof value !== "string") {
        continue;
      }
      fields[key] = sanitizeValidationMessage(value);
    }
  }

  return fields;
}
