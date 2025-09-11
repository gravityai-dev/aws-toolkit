/**
 * Shared platform dependencies for AWS Toolkit services
 */
import { getPlatformDependencies } from "@gravityai-dev/plugin-base";

// Get platform dependencies once
const deps = getPlatformDependencies();

export const getNodeCredentials = deps.getNodeCredentials;
export const saveTokenUsage = deps.saveTokenUsage;
export const createLogger = deps.createLogger;
export const getConfig = deps.getConfig;
export const PromiseNode = deps.PromiseNode;
export const CallbackNode = deps.CallbackNode;
export const NodeExecutionContext = deps.NodeExecutionContext;
export const EnhancedNodeDefinition = deps.EnhancedNodeDefinition;
export const NodeInputType = deps.NodeInputType;

// Create shared loggers
export const transcribeLogger = createLogger("Transcribe");
export const textractLogger = createLogger("AmazonTextract");
