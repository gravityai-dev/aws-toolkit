/**
 * AmazonTextract Node Executor
 * Handles document text extraction using Amazon Textract
 */

import { type NodeExecutionContext } from "@gravityai-dev/plugin-base";
import { AmazonTextractConfig, S3FileInput, AmazonTextractOutput } from "../util/types";
import { processS3FileWithTextract } from "../service/processTextract";
import { PromiseNode, createLogger } from "../../shared/platform";
import { NODE_TYPE } from "./index";

export class AmazonTextractExecutor extends PromiseNode<AmazonTextractConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async validateConfig(config: AmazonTextractConfig): Promise<{ success: boolean; error?: string }> {
    // No specific validation needed for AmazonTextract config
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>, 
    config: AmazonTextractConfig, 
    context: NodeExecutionContext
  ): Promise<AmazonTextractOutput> {
    const logger = createLogger("AmazonTextract");
    // Get file from resolved config
    const fileInput = config.file as S3FileInput;
    
    if (!fileInput || !fileInput.bucket || !fileInput.key) {
      throw new Error('Invalid config: file object must contain bucket and key');
    }

    // Build credential context for AWS services
    const credentialContext = {
      workflowId: context.workflow?.id || "unknown",
      executionId: context.executionId,
      nodeId: context.nodeId,
      nodeType: this.nodeType,
      config: context.config,
      credentials: context.credentials || {},
    };
    
    this.logger.info('Processing file with Amazon Textract', { 
      bucket: fileInput.bucket,
      key: fileInput.key,
      analysisType: config.analysisType || 'DETECT_TEXT'
    });
    
    try {
      // Convert features object to array if needed
      const featuresArray = Array.isArray(config.features) 
        ? config.features 
        : config.features 
          ? Object.values(config.features as Record<string, string>)
          : [];
      
      const processConfig = {
        ...config,
        features: featuresArray as ("TABLES" | "FORMS" | "QUERIES" | "SIGNATURES")[]
      };
      
      this.logger.info('Processing with features', {
        originalFeatures: config.features,
        processedFeatures: processConfig.features,
        analysisType: config.analysisType
      });
      
      // Process the file with Textract
      const result = await processS3FileWithTextract(
        {
          bucket: fileInput.bucket,
          key: fileInput.key
        },
        processConfig,
        credentialContext,
        this.logger
      );
      
      this.logger.info('Successfully extracted text from document', {
        bucket: fileInput.bucket,
        key: fileInput.key,
        textLength: result.text.length,
        pageCount: result.metadata.pageCount,
        confidence: result.metadata.confidence.toFixed(2)
      });
      
      // Return result with __outputs pattern
      const outputs: any = {
        text: result.text,
        metadata: {
          ...result.metadata,
          inputKey: result.inputKey
        },
        outputKey: result.outputKey
      };
      
      // Include additional outputs based on format
      if (config.outputFormat === 'json' || config.outputFormat === 'all') {
        outputs.blocks = result.rawBlocks;
      }
      
      if (config.outputFormat === 'structured' || config.outputFormat === 'all') {
        if (result.structuredText) outputs.structuredText = result.structuredText;
        if (result.tables) outputs.tables = result.tables;
        if (result.formFields) outputs.formFields = result.formFields;
      }
      
      // Medical format not yet implemented in service
      // if (config.outputFormat === 'medical' || config.outputFormat === 'all') {
      //   if (result.medicalText) outputs.medicalText = result.medicalText;
      // }
      
      return {
        __outputs: outputs
      };
    } catch (error) {
      this.logger.error('Failed to process file with Textract', {
        error,
        bucket: fileInput.bucket,
        key: fileInput.key
      });
      throw error;
    }
  }
}
