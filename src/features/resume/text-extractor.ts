import pdf from "pdf-parse";
import mammoth from "mammoth";

/**
 * Converts a raw resume file buffer into plain text, regardless of source
 * format. This isolation point is what lets `parser.ts` stay format-agnostic.
 */
export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const result = await pdf(buffer);
    return result.text;
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Unsupported file type for text extraction: ${mimeType}`);
}
