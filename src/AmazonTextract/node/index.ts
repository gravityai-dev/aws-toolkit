/**
 * AmazonTextract Node Definition
 * Extract text from documents in S3 using Amazon Textract
 */

import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravityai-dev/plugin-base";
import { AmazonTextractExecutor } from "./executor";

export const NODE_TYPE = "AmazonTextract";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();
  
  return {
    packageVersion: "1.0.14",
    type: NODE_TYPE,
    name: "Amazon Textract",
    description: "Extract text from documents in S3 using Amazon Textract",
    category: "Ingest",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1755603269/gravity/icons/Textract.png",
    color: "#10a37f",

    inputs: [
      {
        name: "file",
        type: NodeInputType.OBJECT,
        description: "S3 file object with bucket and key",
      },
    ],

    outputs: [
      {
        name: "text",
        type: NodeInputType.STRING,
        description: "Extracted text content",
      },
      {
        name: "metadata",
        type: NodeInputType.OBJECT,
        description: "Extraction metadata (pages, confidence, etc.)",
      },
      {
        name: "outputKey",
        type: NodeInputType.STRING,
        description: "S3 key of saved output (if saveToS3 is enabled)",
      },
      {
        name: "blocks",
        type: NodeInputType.OBJECT,
        description: "Raw Textract blocks containing structured data (tables, forms, signatures) when outputFormat is 'json' or 'both'",
      },
    ],

    configSchema: {
      type: "object",
      required: ["file"],
      properties: {
        file: {
          type: "object",
          title: "S3 File",
          description: "S3 file object with bucket and key properties",
          default: "",
          "ui:field": "template",
        },
        analysisType: {
          type: "string",
          title: "Analysis Type",
          description: "Type of Textract analysis to perform",
          enum: ["DETECT_TEXT", "ANALYZE_DOCUMENT"],
          enumNames: ["Detect Text (Simple)", "Analyze Document (Advanced)"],
          default: "DETECT_TEXT",
        },
        features: {
          type: "array",
          title: "Document Features",
          description: "Features to extract (only for Analyze Document)",
          items: {
            type: "string",
            enum: ["TABLES", "FORMS", "SIGNATURES"],
          },
          uniqueItems: true,
          default: ["TABLES", "FORMS", "SIGNATURES"],
          "ui:widget": "checkboxes",
          "ui:options": {
            inline: true,
          },
          "ui:dependencies": {
            analysisType: "ANALYZE_DOCUMENT",
          },
        },
        outputFormat: {
          type: "string",
          title: "Output Format",
          description: "Format of the extracted content",
          enum: ["text", "json", "structured", "all", "medical"],
          enumNames: ["Text Only", "Raw JSON", "Structured Data", "All Formats", "Medical Format"],
          default: "text",
        },
        saveToS3: {
          type: "boolean",
          title: "Save to S3",
          description: "Save extracted text back to the same S3 bucket",
          default: false,
          "ui:widget": "toggle",
        },
        outputPrefix: {
          type: "string",
          title: "Output Prefix",
          description: "S3 prefix for saved output files (if saving to S3)",
          default: "textract-output",
          "ui:options": {
            "ui:placeholder": "e.g., extracted-text/",
          },
        },
      },
    },

    credentials: [
      {
        name: "awsCredential",
        required: true,
        displayName: "AWS",
        description: "AWS credentials for Textract and S3 access",
      },
    ],
  };
}

const definition = createNodeDefinition();

export const AmazonTextractNode = {
  definition,
  executor: AmazonTextractExecutor,
};

export { createNodeDefinition };
