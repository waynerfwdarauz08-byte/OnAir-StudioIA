import { API_BASE_URL } from "../config/env.js";

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function readResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return text || null;
}

export async function request(endpoint, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    signal,
  } = options;

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      signal,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "No fue posible conectar. Inténtalo de nuevo en unos momentos."
    );
  }

  const data = await readResponse(response);

  if (!response.ok) {
    let message = "No fue posible completar la solicitud.";

    if (response.status === 404) {
      message = "No encontramos el contenido solicitado.";
    }

    if (response.status === 400) {
      message = "La información enviada no es válida.";
    }

    throw new ApiError(message, response.status, data);
  }

  return data;
}
