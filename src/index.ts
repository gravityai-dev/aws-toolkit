/**
 * AWS Toolkit Plugin for Gravity
 * Provides AWS AI and document processing services including Transcribe and Textract
 */

import packageJson from "../package.json";

export default function createPlugin() {
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    
    async setup(api: any) {

      // Import and register credentials
      const { AWSCredential } = await import("./credentials");
      api.registerCredential(AWSCredential);

      // Import and register Transcribe node
      const { createNodeDefinition: createTranscribeDefinition } = await import("./Transcribe/node");
      const { TranscribeExecutor } = await import("./Transcribe/node/executor");
      
      const transcribeDefinition = createTranscribeDefinition();
      api.registerNode({
        definition: transcribeDefinition,
        executor: TranscribeExecutor,
      });

      // Import and register AmazonTextract node
      const { createNodeDefinition: createTextractDefinition } = await import("./AmazonTextract/node");
      const { AmazonTextractExecutor } = await import("./AmazonTextract/node/executor");
      
      const textractDefinition = createTextractDefinition();
      api.registerNode({
        definition: textractDefinition,
        executor: AmazonTextractExecutor,
      });

      // Plugin loaded successfully
    },
  };
}
