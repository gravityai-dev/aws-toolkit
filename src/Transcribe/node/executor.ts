/**
 * Transcribe Node Executor
 * Handles audio-to-text conversion using AWS Transcribe
 */

import { type NodeExecutionContext } from "@gravityai-dev/plugin-base";
import { TranscribeConfig, TranscribeOutput } from "../util/types";
import { transcribeAudio } from "../service/transcribeAudio";
import { PromiseNode, createLogger } from "../../shared/platform";
import { NODE_TYPE } from "./index";

export class TranscribeExecutor extends PromiseNode<TranscribeConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: TranscribeConfig,
    context: NodeExecutionContext
  ): Promise<TranscribeOutput> {
    const logger = createLogger("Transcribe");
    
    // Get audio input - check both inputs and config
    const audioBase64 = config.audio;

    if (!audioBase64) {
      throw new Error("No audio input provided");
    }

    // Validate base64 format
    if (typeof audioBase64 !== "string") {
      throw new Error("Audio input must be a base64 encoded string");
    }

    logger.info("Starting audio transcription", {
      audioLength: audioBase64.length,
      languageCode: config.languageCode,
      autoDetectLanguage: config.autoDetectLanguage,
      enableSpeakerIdentification: config.enableSpeakerIdentification,
    });

    try {
      // Build credential context for service
      const credentialContext = this.buildCredentialContext(context);
      
      // Call the transcribe service
      const result = await transcribeAudio({
        audioBase64,
        mediaEncoding: config.mediaEncoding,
        languageCode: config.languageCode,
        autoDetectLanguage: config.autoDetectLanguage,
        languageOptions: config.languageOptions,
        enableSpeakerIdentification: config.enableSpeakerIdentification,
        maxSpeakers: config.maxSpeakers,
        vocabularyName: config.vocabularyName,
        filterProfanity: config.filterProfanity,
        logger: logger
      }, credentialContext.credentials?.aws, logger);

      logger.info("Transcription completed successfully", {
        textLength: result.text.length,
        languageCode: result.languageCode,
        confidence: result.confidence,
        hasSpeakerSegments: !!result.speakerSegments?.length,
      });

      return result;
    } catch (error: any) {
      logger.error("Transcription failed", {
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Build credential context from execution context
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    return {
      credentials: {
        aws: context.credentials?.awsCredential || {},
      },
      nodeType: NODE_TYPE,
      workflowId: context.workflow?.id || "",
      executionId: context.executionId || "",
      nodeId: context.nodeId || "",
    };
  }
}
