/**
 * AWS Transcribe streaming service implementation
 */

import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import { TranscribeServiceParams, TranscribeOutput } from "../util/types";

export async function transcribeAudio(
  params: TranscribeServiceParams,
  awsCredentials: any,
  logger: any
): Promise<TranscribeOutput> {
  
  if (!awsCredentials) {
    throw new Error("AWS credentials are required for Transcribe service");
  }

  const transcribeClient = new TranscribeStreamingClient({
    region: awsCredentials.region || "us-east-1",
    credentials: {
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.secretAccessKey,
    },
  });

  try {
    logger.info("Starting streaming transcription", {
      languageCode: params.languageCode,
      autoDetectLanguage: params.autoDetectLanguage,
      mediaEncoding: params.mediaEncoding,
    });

    // Convert base64 to audio buffer
    const audioBuffer = Buffer.from(params.audioBase64, 'base64');
    
    // Create audio stream generator
    async function* audioStream() {
      const chunkSize = 1024 * 8; // 8KB chunks
      for (let i = 0; i < audioBuffer.length; i += chunkSize) {
        const chunk = audioBuffer.slice(i, i + chunkSize);
        yield { AudioEvent: { AudioChunk: chunk } };
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const command = new StartStreamTranscriptionCommand({
      LanguageCode: (params.languageCode || "en-US") as any,
      MediaEncoding: (params.mediaEncoding || "pcm") as any,
      MediaSampleRateHertz: 16000, // Default sample rate
      AudioStream: audioStream(),
      ShowSpeakerLabel: params.enableSpeakerIdentification || false,
      VocabularyName: params.vocabularyName,
      ContentRedactionType: params.filterProfanity ? "PII" : undefined,
    });

    const response = await transcribeClient.send(command);
    
    let fullTranscript = "";
    let confidence = 0;
    let itemCount = 0;
    let detectedLanguage = params.languageCode || "en-US";
    const speakerSegments: any[] = [];

    if (response.TranscriptResultStream) {
      for await (const event of response.TranscriptResultStream) {
        if (event.TranscriptEvent?.Transcript?.Results) {
          for (const result of event.TranscriptEvent.Transcript.Results) {
            if (result.IsPartial === false && result.Alternatives) {
              const alternative = result.Alternatives[0];
              if (alternative.Transcript) {
                fullTranscript += alternative.Transcript + " ";
              }
              
              // Calculate confidence
              if (alternative.Items) {
                for (const item of alternative.Items) {
                  if (item.Confidence !== undefined) {
                    confidence += item.Confidence;
                    itemCount++;
                  }
                  
                  // Extract speaker information if available
                  if (params.enableSpeakerIdentification && item.Speaker) {
                    speakerSegments.push({
                      speakerLabel: `Speaker_${item.Speaker}`,
                      startTime: item.StartTime || 0,
                      endTime: item.EndTime || 0,
                      text: item.Content || "",
                    });
                  }
                }
              }
            }
            
            // Extract detected language
            if (result.LanguageCode) {
              detectedLanguage = result.LanguageCode;
            }
          }
        }
      }
    }

    const averageConfidence = itemCount > 0 ? confidence / itemCount : undefined;
    
    logger.info("Streaming transcription completed", {
      textLength: fullTranscript.trim().length,
      confidence: averageConfidence?.toFixed(2),
      detectedLanguage,
      speakerSegments: speakerSegments.length,
    });

    return {
      text: fullTranscript.trim(),
      confidence: averageConfidence,
      languageCode: detectedLanguage,
      speakerSegments: speakerSegments.length > 0 ? speakerSegments : undefined,
    };

  } catch (error: any) {
    logger.error("Streaming transcription failed", { error: error.message, stack: error.stack });
    throw error;
  }
}
