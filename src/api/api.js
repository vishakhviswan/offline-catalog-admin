// src/api/api.js
const API_BASE = "https://offline-catalog-backend.onrender.com";

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  let data = null;

  if (res.status !== 204) {
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text();
      data = text || null;
    }
  }

  if (!res.ok) {
    const firstError =
      data &&
      typeof data === "object" &&
      Array.isArray(data.errors) &&
      data.errors.length
        ? data.errors[0]
        : null;

    const firstErrorMessage =
      firstError && typeof firstError === "object"
        ? firstError.message || firstError.detail || null
        : typeof firstError === "string"
          ? firstError
          : null;

    const message =
      (data && typeof data === "object" && data.message) ||
      (data && typeof data === "object" && data.error) ||
      firstErrorMessage ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  return parseResponse(res);
}

export async function apiPost(path, body) {
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, isFormData
    ? {
        method: "POST",
        body,
      }
    : {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });

  return parseResponse(res);
}

export async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function apiDelete(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(res);
}
