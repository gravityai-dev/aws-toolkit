/**
 * Transcribe Node Executor
 * Handles audio-to-text conversion using AWS Transcribe
 */

import { getPlatformDependencies } from "@gravityai-dev/plugin-base";
import { TranscribeConfig, TranscribeOutput } from "../util/types";
import { transcribeAudio } from "../service/transcribeAudio";
import { NODE_TYPE } from "./index";

export class TranscribeExecutor {
  private nodeType: string;
  private logger: any;

  constructor() {
    this.nodeType = NODE_TYPE;
    const { createLogger } = getPlatformDependencies();
    this.logger = createLogger(`Node:${this.nodeType}`);
  }

  protected async validateConfig(config: TranscribeConfig): Promise<{ success: boolean; error?: string }> {
    // Validate speaker identification settings
    if (config.enableSpeakerIdentification && config.maxSpeakers) {
      if (config.maxSpeakers < 2 || config.maxSpeakers > 10) {
        return {
          success: false,
          error: "Maximum speakers must be between 2 and 10",
        };
      }
    }

    // Validate language settings
    if (config.autoDetectLanguage && config.languageCode) {
      this.logger.warn("Both autoDetectLanguage and languageCode are set. autoDetectLanguage will take precedence.");
    }

    return { success: true };
  }

  async executeNode(
    inputs: Record<string, any>,
    config: TranscribeConfig,
    context: any
  ): Promise<TranscribeOutput> {
    // Get audio input - check both inputs and config
    const audioBase64 = config.audio;

    if (!audioBase64) {
      throw new Error("No audio input provided");
    }

    // Validate base64 format
    if (typeof audioBase64 !== "string") {
      throw new Error("Audio input must be a base64 encoded string");
    }

    this.logger.info("Starting audio transcription", {
      audioLength: audioBase64.length,
      languageCode: config.languageCode,
      autoDetectLanguage: config.autoDetectLanguage,
      enableSpeakerIdentification: config.enableSpeakerIdentification,
    });

    try {
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
        logger: this.logger
      }, context.credentials?.aws, this.logger);

      this.logger.info("Transcription completed successfully", {
        textLength: result.text.length,
        languageCode: result.languageCode,
        confidence: result.confidence,
        hasSpeakerSegments: !!result.speakerSegments?.length,
      });

      return result;
    } catch (error: any) {
      this.logger.error("Transcription failed", {
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw error;
    }
  }
}
