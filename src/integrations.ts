/** Future adapters only. No remote service is called by the MVP. */
export interface IllustrationBrief {
  concept: string;
  mood: string;
  palette: string[];
  referenceImages: Blob[];
}
export interface ImageGenerationProvider {
  generate(brief: IllustrationBrief, signal?: AbortSignal): Promise<Blob[]>;
}
export interface CloudArchiveProvider {
  upload(backup: Blob, signal?: AbortSignal): Promise<{ remoteId: string }>;
  download(remoteId: string, signal?: AbortSignal): Promise<Blob>;
}
export interface DesignExportProvider {
  exportDocument(document: Record<string, unknown>): Promise<Blob>;
}
