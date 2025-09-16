/**
 * Transcribe Node Definition
 * Converts base64 audio to text using AWS Transcribe
 */

import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravityai-dev/plugin-base";
import { TranscribeExecutor } from "./executor";

export const NODE_TYPE = "Transcribe";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();
  
  return {
    packageVersion: "1.0.16",
    type: NODE_TYPE,
    name: "Transcribe",
    description: "Convert audio to text using AWS Transcribe",
    category: "AI",
    color: "#10a37f",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1756968888/gravity/icons/Transcribe.png",
    inputs: [
      {
        name: "audio",
        type: NodeInputType.STRING,
        description: "Base64 encoded audio data",
      },
    ],
    outputs: [
      {
        name: "text",
        type: NodeInputType.STRING,
        description: "Transcribed text",
      },
      {
        name: "result",
        type: NodeInputType.OBJECT,
        description: "Full transcription result with metadata",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        audio: {
          type: "string",
          title: "Audio",
          description: "Base64 encoded audio data",
          "ui:field": "template",
        },
        mediaEncoding: {
          type: "string",
          title: "Media Encoding",
          description: "Audio encoding format",
          default: "pcm",
          enum: ["pcm", "ogg-opus", "flac"],
          "ui:field": "select",
        },
        languageCode: {
          type: "string",
          title: "Language Code",
          description: "Language of the audio (e.g., en-US, es-US)",
          default: "en-US",
          enum: [
            "en-US",
            "en-GB",
            "es-US",
            "es-ES",
            "fr-FR",
            "fr-CA",
            "de-DE",
            "it-IT",
            "pt-BR",
            "pt-PT",
            "ja-JP",
            "ko-KR",
            "zh-CN",
            "ar-SA",
            "hi-IN",
            "ru-RU",
          ],
          "ui:field": "select",
        },
        autoDetectLanguage: {
          type: "boolean",
          title: "Auto-detect Language",
          description: "Automatically detect the language of the audio",
          default: false,
        },
        enableSpeakerIdentification: {
          type: "boolean",
          title: "Enable Speaker Identification",
          description: "Identify different speakers in the audio",
          default: false,
        },
        maxSpeakers: {
          type: "number",
          title: "Maximum Speakers",
          description: "Maximum number of speakers to identify (2-10)",
          default: 2,
          minimum: 2,
          maximum: 10,
          "ui:widget": "range",
        },
        vocabularyName: {
          type: "string",
          title: "Custom Vocabulary",
          description: "Name of custom vocabulary to improve accuracy (optional)",
          "ui:field": "template",
        },
        filterProfanity: {
          type: "boolean",
          title: "Filter Profanity",
          description: "Replace profane words with asterisks",
          default: false,
        },
      },
      required: [],
      "ui:order": [
        "languageCode",
        "autoDetectLanguage",
        "enableSpeakerIdentification",
        "maxSpeakers",
        "vocabularyName",
        "filterProfanity",
      ],
    },
    capabilities: {
      isTrigger: false,
    },
    credentials: [
      {
        name: "awsCredential",
        required: true,
        displayName: "AWS Credentials",
        description: "AWS credentials for Transcribe API access",
      },
    ],
  };
}

const definition = createNodeDefinition();

export const TranscribeNode = {
  definition,
  executor: TranscribeExecutor,
};

export { createNodeDefinition };
