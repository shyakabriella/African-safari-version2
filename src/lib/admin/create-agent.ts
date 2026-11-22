import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  sameOrigin,
} from "@/lib/auth/server";

import {
  parseDirectoryUser,
  type DirectoryUser,
} from "@/lib/admin/directory";

const API =
  "https://api.hotelandsafari.com/api/admin/users";

const MAX_BODY_BYTES = 8192;

const fields = [
  "name",
  "email",
  "phone",
  "role",
  "password",
  "password_confirmation",
] as const;

type AgentField = typeof fields[number];

type AgentErrors =
  Partial<Record<AgentField, string[]>>;

type AgentPayload = {
  name: string;
  email: string;
  phone: string | null;
  role: "agent";
  password: string;
  password_confirmation: string;
};

export type CreateAgentResult =
  | {
      ok: true;
      data: DirectoryUser;
    }
  | {
      ok: false;
      status: number;
      message: string;
      errors?: AgentErrors;
      outcomeUncertain?: boolean;
    };

type ValidationResult =
  | {
      ok: true;
      payload: AgentPayload;
    }
  | {
      ok: false;
      errors: AgentErrors;
      message: string;
    };

function failure(
  status: number,
  message: string,
  errors?: AgentErrors,
  outcomeUncertain = false
): CreateAgentResult {
  return {
    ok: false,
    status,
    message,
    ...(errors ? { errors } : {}),
    ...(outcomeUncertain
      ? { outcomeUncertain: true }
      : {}),
  };
}

function objectRecord(
  value: unknown
): Record<string, unknown> | null {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function hasOwn(
  object: Record<string, unknown>,
  field: string
): boolean {
  return Object.prototype.hasOwnProperty.call(
    object,
    field
  );
}

function characterCount(value: string): number {
  return Array.from(value).length;
}

function byteCount(value: string): number {
  return new TextEncoder().encode(value).length;
}

function hasControlCharacters(
  value: string
): boolean {
  return /[\u0000-\u001f\u007f]/.test(value);
}

function hasInvalidUnicode(
  value: string
): boolean {
  // Reject unpaired UTF-16 surrogate characters,
  // which cannot be represented faithfully in UTF-8.
  for (const character of value) {
    const point = character.codePointAt(0);

    if (
      point !== undefined &&
      point >= 0xd800 &&
      point <= 0xdfff
    ) {
      return true;
    }
  }

  return false;
}

export function validateAgentPayload(
  body: unknown
): ValidationResult {
  const input = objectRecord(body);

  if (!input) {
    return {
      ok: false,
      errors: {},
      message: "Invalid account creation request.",
    };
  }

  if (
    Object.keys(input).some(
      key => !fields.some(field => field === key)
    )
  ) {
    return {
      ok: false,
      errors: {},
      message: "Unsupported account fields.",
    };
  }

  const errors: AgentErrors = {};

  const rawName = input.name;
  const rawEmail = input.email;
  const rawPhone = input.phone;
  const rawRole = input.role;
  const rawPassword = input.password;
  const rawConfirmation =
    input.password_confirmation;

  const name =
    typeof rawName === "string"
      ? rawName.trim()
      : "";

  const email =
    typeof rawEmail === "string"
      ? rawEmail.trim().toLowerCase()
      : "";

  const phone =
    typeof rawPhone === "string"
      ? rawPhone.trim() || null
      : null;

  const password =
    typeof rawPassword === "string"
      ? rawPassword
      : "";

  const confirmation =
    typeof rawConfirmation === "string"
      ? rawConfirmation
      : "";

  if (
    typeof rawName !== "string" ||
    !name ||
    characterCount(name) > 120 ||
    hasControlCharacters(name) ||
    hasInvalidUnicode(name)
  ) {
    errors.name = [
      "Enter a valid full name of up to 120 characters.",
    ];
  }

  if (
    typeof rawEmail !== "string" ||
    !email ||
    characterCount(email) > 190 ||
    hasControlCharacters(email) ||
    hasInvalidUnicode(email) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = [
      "Enter a valid email address.",
    ];
  }

  if (
    hasOwn(input, "phone") &&
    rawPhone !== null &&
    typeof rawPhone !== "string"
  ) {
    errors.phone = [
      "Enter a valid phone number.",
    ];
  }

  if (
    phone !== null &&
    (
      characterCount(phone) > 40 ||
      hasControlCharacters(phone) ||
      hasInvalidUnicode(phone)
    )
  ) {
    errors.phone = [
      "Enter a valid phone number of up to 40 characters.",
    ];
  }

  // The browser may never assign a privileged role.
  if (rawRole !== "agent") {
    errors.role = [
      "Only agent accounts can be created here.",
    ];
  }

  // Preserve the password exactly as provided.
  if (
    typeof rawPassword !== "string" ||
    characterCount(password) < 12 ||
    byteCount(password) > 72 ||
    password.includes("\u0000") ||
    hasInvalidUnicode(password)
  ) {
    errors.password = [
      "Use at least 12 characters and no more than 72 UTF-8 bytes.",
    ];
  }

  if (
    typeof rawConfirmation !== "string" ||
    !confirmation ||
    confirmation !== password ||
    byteCount(confirmation) > 72
  ) {
    errors.password_confirmation = [
      "The passwords must match.",
    ];
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message:
        "Please correct the highlighted fields.",
    };
  }

  return {
    ok: true,
    payload: {
      name,
      email,
      phone,
      role: "agent",
      password,
      password_confirmation: confirmation,
    },
  };
}

async function readLimitedJson(
  request: NextRequest
): Promise<
  | { ok: true; body: unknown }
  | { ok: false; status: number }
> {
  const length =
    request.headers.get("content-length");

  if (
    length !== null &&
    (
      !/^\d+$/.test(length) ||
      !Number.isSafeInteger(Number(length))
    )
  ) {
    return { ok: false, status: 422 };
  }

  if (
    length !== null &&
    Number(length) > MAX_BODY_BYTES
  ) {
    return { ok: false, status: 413 };
  }

  if (!request.body) {
    return { ok: false, status: 422 };
  }

  const reader = request.body.getReader();

  const decoder = new TextDecoder(
    "utf-8",
    { fatal: true }
  );

  let total = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      total += value.byteLength;

      if (total > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => undefined);

        return {
          ok: false,
          status: 413,
        };
      }

      text += decoder.decode(
        value,
        { stream: true }
      );
    }

    text += decoder.decode();

    return {
      ok: true,
      body: JSON.parse(text),
    };

  } catch {
    return {
      ok: false,
      status: 422,
    };

  } finally {
    reader.releaseLock();
  }
}

function backendValidationErrors(
  source: unknown
): AgentErrors {
  const input = objectRecord(source);

  const errors: AgentErrors = {};

  if (!input) return errors;

  // Use fixed messages rather than arbitrary
  // upstream text that might contain credentials
  // or internal implementation details.
  const messages: Record<AgentField, string> = {
    name: "Please review the agent's full name.",
    email: "This email is invalid or already registered.",
    phone: "Please review the phone number.",
    role: "Only agent accounts can be created here.",
    password: "The password does not meet the security requirements.",
    password_confirmation: "The passwords must match.",
  };

  for (const field of fields) {
    if (!hasOwn(input, field)) continue;

    const value = input[field];

    if (
      Array.isArray(value) &&
      value.some(item => typeof item === "string")
    ) {
      errors[field] = [messages[field]];
    }
  }

  return errors;
}

function uncertain(
  status = 503
): CreateAgentResult {
  return failure(
    status,
    "Unable to confirm account creation. Check the Users Directory before trying again.",
    undefined,
    true
  );
}

export async function createAgent(
  request: NextRequest
): Promise<CreateAgentResult> {

  // Authenticate and authorize before processing
  // the submitted account information.
  const access = await getAccountAccess();

  if (access.status === "unauthenticated") {
    return failure(
      401,
      "Please sign in again."
    );
  }

  if (access.status === "unavailable") {
    return failure(
      503,
      "Account verification is temporarily unavailable."
    );
  }

  if (
    access.status !== "authenticated" ||
    access.user.role !== "admin"
  ) {
    return failure(
      403,
      "Administrator access required."
    );
  }

  if (!sameOrigin(request)) {
    return failure(
      403,
      "Request not allowed."
    );
  }

  // Additional origin validation for this
  // sensitive administrative operation.
  const origin = request.headers.get("origin");

  try {
    const parsed = new URL(origin ?? "");

    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.origin !== origin ||
      (
        parsed.protocol === "http:" &&
        !["localhost", "127.0.0.1", "[::1]"]
          .includes(parsed.hostname)
      )
    ) {
      return failure(
        403,
        "Request not allowed."
      );
    }

  } catch {
    return failure(
      403,
      "Request not allowed."
    );
  }

  if (request.nextUrl.search) {
    return failure(
      422,
      "Unexpected query parameters."
    );
  }

  const mediaType = (
    request.headers.get("content-type") ?? ""
  ).split(";")[0].trim().toLowerCase();

  if (mediaType !== "application/json") {
    return failure(
      415,
      "An application/json request is required."
    );
  }

  const encoding =
    request.headers.get("content-encoding");

  if (
    encoding &&
    encoding.trim().toLowerCase() !== "identity"
  ) {
    return failure(
      415,
      "Unsupported request encoding."
    );
  }

  const parsedBody =
    await readLimitedJson(request);

  if (!parsedBody.ok) {
    return failure(
      parsedBody.status,
      parsedBody.status === 413
        ? "Account creation request is too large."
        : "Invalid account creation request."
    );
  }

  const validated = validateAgentPayload(
    parsedBody.body
  );

  if (!validated.ok) {
    return failure(
      422,
      validated.message,
      validated.errors
    );
  }

  const store = await cookies();

  const token =
    store.get("afhbh_session")?.value;

  if (!token) {
    return failure(
      401,
      "Please sign in again."
    );
  }

  const payload = validated.payload;

  try {
    // This POST request is intentionally not retried.
    const response = await fetch(API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });

    switch (response.status) {
      case 401:
        return failure(
          401,
          "Please sign in again."
        );

      case 403:
        return failure(
          403,
          "Administrator access required."
        );

      case 422: {
        const raw: unknown =
          await response.json().catch(() => null);

        const result = objectRecord(raw);

        return failure(
          422,
          "Please review the agent's account details.",
          backendValidationErrors(result?.errors)
        );
      }

      case 429:
        return failure(
          429,
          "Too many requests. Please try again later."
        );
    }

    if (response.status !== 201) {
      return uncertain(
        response.ok ? 502 : 503
      );
    }

    const raw: unknown =
      await response.json().catch(() => null);

    const result = objectRecord(raw);

    if (!result || result.success !== true) {
      return uncertain(502);
    }

    const user =
      parseDirectoryUser(result.data);

    // Verify the response describes the expected
    // newly created agent, not a different account.
    if (
      !user ||
      user.role !== "agent" ||
      user.is_active !== true ||
      user.id === access.user.id ||
      user.name !== payload.name ||
      user.email !== payload.email ||
      user.phone !== payload.phone
    ) {
      return uncertain(502);
    }

    return {
      ok: true,
      data: user,
    };

  } catch {
    return uncertain();
  }
}
