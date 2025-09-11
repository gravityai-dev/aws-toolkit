/**
 * Type definitions for AmazonTextract node
 */

export interface AmazonTextractConfig {
  file?: S3FileInput;
  analysisType?: 'DETECT_TEXT' | 'ANALYZE_DOCUMENT';
  features?: ('TABLES' | 'FORMS' | 'QUERIES' | 'SIGNATURES')[];
  outputFormat?: 'text' | 'json' | 'structured' | 'all' | 'medical';
  textOptions?: {
    includeConfidence?: boolean;
    includeTables?: boolean;
    tableFormat?: 'plain' | 'markdown' | 'csv';
    preserveLayout?: boolean;
    minConfidence?: number;
    textOnly?: boolean;
  };
  saveToS3?: boolean;
  outputPrefix?: string;
}

export interface S3FileInput {
  key: string;
  bucket: string;
  size?: number;
  lastModified?: string;
  universalId?: string;
  etag?: string;
}

export interface TextractMetadata {
  pageCount: number;
  blockCount: number;
  confidence: number;
  bucket: string;
  inputKey: string;
}

export interface AmazonTextractOutput {
  __outputs: {
    text: string;
    metadata: TextractMetadata;
    outputKey?: string;
    blocks?: any[]; // Raw Textract blocks
    structuredText?: any; // Structured text data
    tables?: any[]; // Extracted tables
    formFields?: any; // Form fields
  };
}
