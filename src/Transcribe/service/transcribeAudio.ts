/**
 * AWS Transcribe service implementation
 */

import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { TranscribeServiceParams, TranscribeOutput } from "../util/types";
// Logger will be passed as parameter

export async function transcribeAudio(
  params: TranscribeServiceParams,
  awsCredentials: any,
  logger: any
): Promise<TranscribeOutput> {
  
  if (!awsCredentials) {
    throw new Error("AWS credentials are required for Transcribe service");
  }

  const transcribeClient = new TranscribeClient({
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
    // Generate unique job name
    const jobName = `transcribe-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const bucketName = awsCredentials.tempBucket || "gravity-temp-audio";
    const audioKey = `audio/${jobName}.${getFileExtension(params.mediaEncoding || "pcm")}`;

    // Upload audio to S3
    logger.info("Uploading audio to S3", { bucket: bucketName, key: audioKey });
    
    const audioBuffer = Buffer.from(params.audioBase64, 'base64');
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: audioKey,
      Body: audioBuffer,
      ContentType: getContentType(params.mediaEncoding || "pcm"),
    }));

    // Start transcription job
    const transcriptionParams: any = {
      TranscriptionJobName: jobName,
      LanguageCode: params.languageCode || "en-US",
      Media: {
        MediaFileUri: `s3://${bucketName}/${audioKey}`,
      },
      MediaFormat: params.mediaEncoding || "pcm",
      OutputBucketName: bucketName,
      OutputKey: `transcripts/${jobName}.json`,
    };

    // Add optional parameters
    if (params.autoDetectLanguage) {
      transcriptionParams.IdentifyLanguage = true;
      if (params.languageOptions) {
        transcriptionParams.LanguageOptions = params.languageOptions;
      }
    }

    if (params.enableSpeakerIdentification) {
      transcriptionParams.Settings = {
        ...transcriptionParams.Settings,
        ShowSpeakerLabels: true,
        MaxSpeakerLabels: params.maxSpeakers || 2,
      };
    }

    if (params.vocabularyName) {
      transcriptionParams.Settings = {
        ...transcriptionParams.Settings,
        VocabularyName: params.vocabularyName,
      };
    }

    if (params.filterProfanity) {
      transcriptionParams.ContentRedaction = {
        RedactionType: "PII",
        RedactionOutput: "redacted",
      };
    }

    logger.info("Starting transcription job", { jobName, params: transcriptionParams });
    
    await transcribeClient.send(new StartTranscriptionJobCommand(transcriptionParams));

    // Poll for completion
    let jobStatus = "IN_PROGRESS";
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time
    
    while (jobStatus === "IN_PROGRESS" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const jobResult = await transcribeClient.send(
        new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
      );
      
      jobStatus = jobResult.TranscriptionJob?.TranscriptionJobStatus || "FAILED";
      attempts++;
      
      logger.info("Transcription job status", { jobName, status: jobStatus, attempt: attempts });
    }

    if (jobStatus !== "COMPLETED") {
      throw new Error(`Transcription job failed with status: ${jobStatus}`);
    }

    // Get the transcription result
    const resultKey = `transcripts/${jobName}.json`;
    const resultObject = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: resultKey,
    }));

    const resultText = await resultObject.Body?.transformToString();
    if (!resultText) {
      throw new Error("Failed to retrieve transcription result");
    }

    const transcriptionResult = JSON.parse(resultText);
    const transcript = transcriptionResult.results?.transcripts?.[0]?.transcript || "";
    
    // Extract additional information
    const confidence = calculateAverageConfidence(transcriptionResult.results?.items || []);
    const languageCode = transcriptionResult.results?.language_code || params.languageCode;
    const speakerSegments = extractSpeakerSegments(transcriptionResult.results?.speaker_labels);

    // Clean up temporary files
    try {
      // Note: In production, you might want to keep these for debugging or implement a cleanup job
      logger.info("Transcription completed successfully", { 
        jobName, 
        textLength: transcript.length,
        confidence: confidence?.toFixed(2)
      });
    } catch (cleanupError) {
      logger.warn("Failed to cleanup temporary files", { error: cleanupError });
    }

    return {
      text: transcript,
      confidence,
      languageCode,
      speakerSegments,
    };

  } catch (error: any) {
    logger.error("Transcription failed", { error: error.message, stack: error.stack });
    throw error;
  }
}

function getFileExtension(mediaEncoding: string): string {
  switch (mediaEncoding) {
    case "ogg-opus":
      return "ogg";
    case "flac":
      return "flac";
    case "pcm":
    default:
      return "wav";
  }
}

function getContentType(mediaEncoding: string): string {
  switch (mediaEncoding) {
    case "ogg-opus":
      return "audio/ogg";
    case "flac":
      return "audio/flac";
    case "pcm":
    default:
      return "audio/wav";
  }
}

function calculateAverageConfidence(items: any[]): number | undefined {
  if (!items || items.length === 0) return undefined;
  
  const confidenceValues = items
    .filter(item => item.type === "pronunciation" && item.alternatives?.[0]?.confidence)
    .map(item => parseFloat(item.alternatives[0].confidence));
  
  if (confidenceValues.length === 0) return undefined;
  
  return confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length;
}

function extractSpeakerSegments(speakerLabels: any): any[] | undefined {
  if (!speakerLabels?.segments) return undefined;
  
  return speakerLabels.segments.map((segment: any) => ({
    speakerLabel: segment.speaker_label,
    startTime: parseFloat(segment.start_time),
    endTime: parseFloat(segment.end_time),
    text: segment.items?.map((item: any) => item.content).join(" ") || "",
  }));
}
