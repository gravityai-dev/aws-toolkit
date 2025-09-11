# AWS Toolkit Package

AWS services integration for Gravity workflow system, providing nodes for common AWS AI and document processing services.

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
