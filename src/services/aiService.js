const AI_WEBHOOK_URL =
  import.meta.env.VITE_N8N_AI_WEBHOOK_URL;

function getErrorMessage(data, fallbackMessage) {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.error) {
    return typeof data.error === "string"
      ? data.error
      : data.error.message;
  }

  return fallbackMessage;
}

export const aiService = {
  async generateEditorialContent(
    sourceData,
    signal
  ) {
    if (!AI_WEBHOOK_URL) {
      throw new Error(
        "No está configurada la dirección del webhook de n8n."
      );
    }

    let response;

    try {
      response = await fetch(AI_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sourceData),
        signal,
      });
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }

      throw new Error(
        "No fue posible conectar con n8n. Comprueba que esté ejecutándose con n8n start."
      );
    }

    const responseText = await response.text();

    let responseData;

    try {
      responseData = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          responseData,
          "n8n no pudo procesar la solicitud."
        )
      );
    }

    const normalizedResponse = Array.isArray(
      responseData
    )
      ? responseData[0]
      : responseData;

    const result =
      normalizedResponse?.data ??
      normalizedResponse?.result ??
      normalizedResponse;

    if (
      !result ||
      typeof result !== "object" ||
      !result.title
    ) {
      throw new Error(
        "La respuesta de la IA no tiene el formato esperado."
      );
    }

    return result;
  },
};