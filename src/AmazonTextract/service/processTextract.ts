/**
 * AWS Textract service implementation
 */

import { TextractClient, DetectDocumentTextCommand, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AmazonTextractConfig, S3FileInput, TextractMetadata } from "../util/types";
import { createLogger } from "../../shared/platform";

export async function processS3FileWithTextract(
  fileInput: S3FileInput,
  config: AmazonTextractConfig,
  credentialContext: any,
  logger: any
) {
  const awsCredentials = credentialContext.credentials?.aws;
  
  if (!awsCredentials) {
    throw new Error("AWS credentials are required for Textract service");
  }

  const textractClient = new TextractClient({
    region: awsCredentials.region || "us-east-1",
    credentials: {
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.secretAccessKey,
    },
  });

  const s3Client = new S3Client({
    region: awsCredentials.region || "us-east-1",
    credentials: {
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.secretAccessKey,
    },
  });

  try {
    logger.info("Processing document with Textract", {
      bucket: fileInput.bucket,
      key: fileInput.key,
      analysisType: config.analysisType || "DETECT_TEXT"
    });

    const document = {
      S3Object: {
        Bucket: fileInput.bucket,
        Name: fileInput.key,
      },
    };

    let result;
    let rawBlocks: any[] = [];

    if (config.analysisType === "ANALYZE_DOCUMENT") {
      // Advanced analysis with features
      const command = new AnalyzeDocumentCommand({
        Document: document,
        FeatureTypes: config.features || ["TABLES", "FORMS"],
      });
      
      result = await textractClient.send(command);
      rawBlocks = result.Blocks || [];
    } else {
      // Simple text detection
      const command = new DetectDocumentTextCommand({
        Document: document,
      });
      
      result = await textractClient.send(command);
      rawBlocks = result.Blocks || [];
    }

    // Extract text from blocks
    const textBlocks = rawBlocks.filter(block => block.BlockType === "LINE");
    const extractedText = textBlocks
      .map(block => block.Text)
      .filter(text => text)
      .join("\n");

    // Calculate metadata
    const pageCount = Math.max(1, new Set(rawBlocks.map(block => block.Page)).size);
    const blockCount = rawBlocks.length;
    const confidenceValues = rawBlocks
      .filter(block => block.Confidence !== undefined)
      .map(block => block.Confidence);
    const averageConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length
      : 0;

    const metadata: TextractMetadata = {
      pageCount,
      blockCount,
      confidence: averageConfidence,
      bucket: fileInput.bucket,
      inputKey: fileInput.key,
    };

    // Process structured data if requested
    let structuredText, tables, formFields;
    
    if (config.outputFormat === "structured" || config.outputFormat === "all") {
      structuredText = extractStructuredText(rawBlocks);
      tables = extractTables(rawBlocks);
      formFields = extractFormFields(rawBlocks);
    }

    // Save to S3 if requested
    let outputKey;
    if (config.saveToS3) {
      const prefix = config.outputPrefix || "textract-output";
      outputKey = `${prefix}/${fileInput.key.split('/').pop()}.txt`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: fileInput.bucket,
        Key: outputKey,
        Body: extractedText,
        ContentType: "text/plain",
      }));
      
      logger.info("Saved extracted text to S3", { bucket: fileInput.bucket, key: outputKey });
    }

    return {
      text: extractedText,
      metadata,
      outputKey,
      inputKey: fileInput.key,
      rawBlocks,
      structuredText,
      tables,
      formFields,
    };

  } catch (error: any) {
    logger.error("Textract processing failed", {
      error: error.message,
      bucket: fileInput.bucket,
      key: fileInput.key,
      stack: error.stack,
    });
    throw error;
  }
}

function extractStructuredText(blocks: any[]): any {
  // Group blocks by page and type for structured output
  const pages: any = {};
  
  blocks.forEach(block => {
    const page = block.Page || 1;
    if (!pages[page]) {
      pages[page] = { lines: [], words: [], tables: [], forms: [] };
    }
    
    switch (block.BlockType) {
      case "LINE":
        pages[page].lines.push({
          text: block.Text,
          confidence: block.Confidence,
          geometry: block.Geometry,
        });
        break;
      case "WORD":
        pages[page].words.push({
          text: block.Text,
          confidence: block.Confidence,
          geometry: block.Geometry,
        });
        break;
    }
  });
  
  return pages;
}

function extractTables(blocks: any[]): any[] {
  const tables: any[] = [];
  const tableBlocks = blocks.filter(block => block.BlockType === "TABLE");
  
  tableBlocks.forEach(table => {
    const cells: any[] = [];
    
    if (table.Relationships) {
      const cellIds = table.Relationships
        .find((rel: any) => rel.Type === "CHILD")?.Ids || [];
      
      cellIds.forEach((cellId: string) => {
        const cell = blocks.find(block => block.Id === cellId);
        if (cell && cell.BlockType === "CELL") {
          cells.push({
            rowIndex: cell.RowIndex,
            columnIndex: cell.ColumnIndex,
            text: extractCellText(cell, blocks),
            confidence: cell.Confidence,
          });
        }
      });
    }
    
    tables.push({
      id: table.Id,
      confidence: table.Confidence,
      cells: cells.sort((a, b) => {
        if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
        return a.columnIndex - b.columnIndex;
      }),
    });
  });
  
  return tables;
}

function extractFormFields(blocks: any[]): any {
  const formFields: any = {};
  const keyValueSets = blocks.filter(block => block.BlockType === "KEY_VALUE_SET");
  
  keyValueSets.forEach(kvSet => {
    if (kvSet.EntityTypes?.includes("KEY")) {
      const keyText = extractKeyValueText(kvSet, blocks);
      const valueBlock = findValueForKey(kvSet, blocks);
      const valueText = valueBlock ? extractKeyValueText(valueBlock, blocks) : "";
      
      if (keyText) {
        formFields[keyText] = {
          value: valueText,
          confidence: kvSet.Confidence,
        };
      }
    }
  });
  
  return formFields;
}

function extractCellText(cell: any, blocks: any[]): string {
  if (!cell.Relationships) return "";
  
  const wordIds = cell.Relationships
    .find((rel: any) => rel.Type === "CHILD")?.Ids || [];
  
  return wordIds
    .map((wordId: string) => {
      const word = blocks.find(block => block.Id === wordId);
      return word?.Text || "";
    })
    .join(" ");
}

function extractKeyValueText(kvSet: any, blocks: any[]): string {
  if (!kvSet.Relationships) return "";
  
  const wordIds = kvSet.Relationships
    .find((rel: any) => rel.Type === "CHILD")?.Ids || [];
  
  return wordIds
    .map((wordId: string) => {
      const word = blocks.find(block => block.Id === wordId);
      return word?.Text || "";
    })
    .join(" ");
}

function findValueForKey(keyBlock: any, blocks: any[]): any | null {
  if (!keyBlock.Relationships) return null;
  
  const valueId = keyBlock.Relationships
    .find((rel: any) => rel.Type === "VALUE")?.Ids?.[0];
  
  if (!valueId) return null;
  
  return blocks.find(block => block.Id === valueId && block.EntityTypes?.includes("VALUE")) || null;
}
