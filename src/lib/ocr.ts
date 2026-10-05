/**
 * On-device English OCR. The image is never uploaded.
 * Tesseract runs in the browser; only the tessdata model is fetched once.
 */
export async function recognizeEnglish(image: File | Blob): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(image);
    return (data.text ?? "").trim();
  } finally {
    await worker.terminate();
  }
}
