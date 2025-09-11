# AWS Toolkit

AWS services toolkit for Gravity workflow system providing AI-powered document processing and audio transcription capabilities.

## Features

### Transcribe Node
- Convert audio to text using AWS Transcribe
- Support for multiple audio formats (PCM, OGG-Opus, FLAC)
- Language detection and speaker identification
- Custom vocabulary and profanity filtering

### AmazonTextract Node
- Extract text and data from documents using Amazon Textract
- Simple text detection and advanced document analysis
- Table and form extraction capabilities
- Multiple output formats (text, JSON, structured)
- S3 integration for document processing

## Installation

```bash
npm install @gravityai-dev/aws-toolkit
```

## Usage

This package integrates with the Gravity workflow system through the plugin architecture. Nodes are automatically registered when the package is loaded.

## Requirements

- AWS credentials configured for Transcribe and Textract services
- Node.js 18+ and TypeScript support

## Included Nodes

### Transcribe
- **Purpose**: Convert audio to text using AWS Transcribe
- **Category**: AI
- **Features**: 
  - Multiple audio format support (PCM, OGG-Opus, FLAC)
  - Language detection and multi-language support
  - Speaker identification
  - Custom vocabulary support
  - Profanity filtering

### AmazonTextract
- **Purpose**: Extract text and data from documents using Amazon Textract
- **Category**: Ingest
- **Features**:
  - Simple text detection and advanced document analysis
  - Table, form, and signature extraction
  - Multiple output formats (text, JSON, structured)
  - S3 integration for input and output

## Installation

This package is part of the Gravity services ecosystem and integrates via the plugin system.

## Configuration

Both nodes require AWS credentials configured in the Gravity system.

## Usage

Add these nodes to your Gravity workflows through the visual workflow editor.
