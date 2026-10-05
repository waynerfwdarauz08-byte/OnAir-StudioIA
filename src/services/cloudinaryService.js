const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const cloudinaryService = {
  async uploadNewsImage(file) {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error(
        "Falta configurar Cloudinary. Comprueba el Cloud name y el upload preset en .env.local y reinicia Vite."
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("Selecciona una imagen JPG, PNG o WebP.");
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("La imagen debe pesar 5 MB o menos.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    let response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/upload`,
        { method: "POST", body: formData }
      );
    } catch {
      throw new Error("No fue posible conectar con Cloudinary. Comprueba tu conexión e inténtalo de nuevo.");
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("Cloudinary devolvió una respuesta que no se pudo leer.");
    }

    if (!response.ok || !result.secure_url || !result.public_id) {
      throw new Error(
        result.error?.message || "Cloudinary no pudo subir la imagen. Revisa el preset unsigned."
      );
    }

    return {
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    };
  },
};
