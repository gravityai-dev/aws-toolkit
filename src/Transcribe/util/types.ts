/**
 * Type definitions for the Transcribe node
 */

export interface TranscribeConfig {
  /**
   * Base64 encoded audio
   */
  audio?: string;
  /**
   * Media encoding format
   */
  mediaEncoding?: "pcm" | "ogg-opus" | "flac";
  /**
   * Language code for transcription (e.g., 'en-US', 'es-US')
   */
  languageCode?: string;
  
  /**
   * Whether to enable automatic language detection
   */
  autoDetectLanguage?: boolean;
  
  /**
   * List of language codes to identify
   */
  languageOptions?: string[];
  
  /**
   * Whether to identify different speakers in the audio
   */
  enableSpeakerIdentification?: boolean;
  
  /**
   * Maximum number of speakers to identify (2-10)
   */
  maxSpeakers?: number;
  
  /**
   * Whether to identify different channels in the audio
   */
  enableChannelIdentification?: boolean;
  
  /**
   * Number of channels to identify
   */
  numberOfChannels?: number;
  
  /**
   * Whether to show speaker labels
   */
  showSpeakerLabels?: boolean;
  
  /**
   * Custom vocabulary name to improve transcription accuracy
   */
  vocabularyName?: string;
  
  /**
   * Custom vocabulary filter name to filter out unwanted words
   */
  vocabularyFilterName?: string;
  
  /**
   * Method to use for vocabulary filtering (remove, mask, or tag)
   */
  vocabularyFilterMethod?: "remove" | "mask" | "tag";
  
  /**
   * Whether to enable partial results stabilization
   */
  enablePartialResultsStabilization?: boolean;
  
  /**
   * Level of partial results stability (high, medium, or low)
   */
  partialResultsStability?: "high" | "medium" | "low";
  
  /**
   * Type of content identification to perform
   */
  contentIdentificationType?: string;
  
  /**
   * Type of content redaction to perform
   */
  contentRedactionType?: string;
  
  /**
   * Types of PII entities to identify
   */
  piiEntityTypes?: string;
  
  /**
   * Name of the language model to use
   */
  languageModelName?: string;
  
  /**
   * Whether to identify the language of the audio
   */
  identifyLanguage?: boolean;
  
  /**
   * Whether to identify multiple languages in the audio
   */
  identifyMultipleLanguages?: boolean;
  
  /**
   * Preferred language to use for transcription
   */
  preferredLanguage?: string;
  
  /**
   * Whether to filter profanity
   */
  filterProfanity?: boolean;
}

export interface TranscribeOutput {
  /**
   * The transcribed text
   */
  text: string;
  
  /**
   * Confidence score of the transcription (0-1)
   */
  confidence?: number;
  
  /**
   * Detected or specified language code
   */
  languageCode?: string;
  
  /**
   * Speaker segments if speaker identification was enabled
   */
  speakerSegments?: SpeakerSegment[];
  
  /**
   * Alternative transcriptions with confidence scores
   */
  alternatives?: TranscriptionAlternative[];
  
  /**
   * Duration of the audio in seconds
   */
  duration?: number;
}

export interface SpeakerSegment {
  speakerLabel: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface TranscriptionAlternative {
  transcript: string;
  confidence: number;
}

export interface TranscribeServiceParams {
  audioBase64: string;
  mediaEncoding?: "pcm" | "ogg-opus" | "flac";
  languageCode?: string;
  autoDetectLanguage?: boolean;
  languageOptions?: string[];
  enableSpeakerIdentification?: boolean;
  maxSpeakers?: number;
  enableChannelIdentification?: boolean;
  numberOfChannels?: number;
  showSpeakerLabels?: boolean;
  vocabularyName?: string;
  vocabularyFilterName?: string;
  vocabularyFilterMethod?: "remove" | "mask" | "tag";
  enablePartialResultsStabilization?: boolean;
  partialResultsStability?: "high" | "medium" | "low";
  contentIdentificationType?: string;
  contentRedactionType?: string;
  piiEntityTypes?: string;
  languageModelName?: string;
  identifyLanguage?: boolean;
  identifyMultipleLanguages?: boolean;
  preferredLanguage?: string;
  filterProfanity?: boolean;
  logger?: any;
}
