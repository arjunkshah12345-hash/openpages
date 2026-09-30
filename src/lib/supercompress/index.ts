/**
 * SuperCompress integration for OpenPages.
 *
 * @see ./client.ts  — compressContext (hosted API + local fallback)
 * @see ./pipeline.ts — buildCompressedContext (Retrieval → SuperCompress → prompt)
 * @see https://www.supercompress.dev
 */

export {
  compressContext,
  formatCompressSummary,
  type CompressResult,
  type CompressMode,
  type CompressOptions,
} from "./client";

export { buildCompressedContext, type PipelineResult } from "./pipeline";
