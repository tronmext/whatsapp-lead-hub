# Design Spec: Leadflow GG.AI Labs Migration (Mock to D1 + Evolution API)

**Status:** Draft
**Date:** 2026-05-15
**Topic:** Database Migration, Evolution API Integration, and AI Orchestration.

## 1. Overview

Transform the "Whatsapp Lead Hub" prototype into a production-ready platform named **Leadflow**, part of the **GG.AI Labs** ecosystem. The goal is to replace all mock data with a Cloudflare D1 database and integrate real-time communication via Evolution API v2.

## 2. Core Requirements

- **Multi-Instance Support:** Maintain the architecture for 2+ instances (L1, L2, etc.).
- **Contact Classification:** Support for Personal, Business, Leads, and Groups.
- **AI Orchestration:** Toggleable AI auto-replies per contact, automated insights/summaries, and custom prompt management.
- **Dynamic Referrals:** Forward contacts to team members (via WhatsApp vCard + AI Summary) or external CRMs (via Webhook).
- **Clean Architecture:** Modular services, event-driven processing, and scalable schema.

## 3. Architecture Design

### 3.1. Event Orchestrator (Backend)

A centralized handler for Evolution API webhooks.

- **Path:** `src/routes/api/public/evolution.webhook.ts`
- **Responsibility:** Receive `MESSAGES_UPSERT`, load contact context from D1, decide if AI should respond, and log the interaction.

### 3.2. Service Layer

- `EvolutionService`: Wraps Evolution API v2 endpoints (SendText, SendContact, SendMedia, FetchInstances, etc.).
- `AIService`: Manages communication with LLMs (Gemini/OpenAI) for response generation and insight extraction.
- `DatabaseService`: Handles all D1 interactions using a clean repository pattern.
- `IntegrationService`: Manages outbound webhooks to external CRMs and internal referral logic.

## 4. Data Schema (Cloudflare D1)

### Table: `instances`

Stores configuration for each WhatsApp number connected.

- `id`: PK (e.g., "L1")
- `name`: Instance name
- `api_key`: Evolution API Key
- `webhook_token`: Token for validating incoming webhooks
- `is_active`: Boolean

### Table: `contacts`

The core entity, supporting multiple types.

- `jid`: PK (WhatsApp ID)
- `instance_id`: FK
- `name`: Display name
- `type`: ENUM ('personal', 'business', 'lead', 'group')
- `status`: ENUM ('novo', 'negociacao', 'qualificado', 'perdido')
- `score`: Integer (0-100)
- `ai_enabled`: Boolean (Auto-reply toggle)
- `prompt_id`: FK (Library of prompts)
- `metadata`: JSON (Additional fields for CRM sync)

### Table: `messages`

Full interaction history.

- `id`: PK (Evolution Message ID)
- `contact_id`: FK
- `from_me`: Boolean
- `content`: Text
- `type`: ENUM ('text', 'image', 'audio', 'vcard', etc.)
- `timestamp`: DateTime

### Table: `notes` & `tags`

- `notes`: User-added persistent notes.
- `tags`: Global library of tags.
- `contact_tags`: Many-to-many relationship.

### Table: `prompts_library`

- `id`: PK
- `name`: Friendly name
- `content`: The system prompt text
- `category`: ENUM ('sales', 'tech', 'summary', 'referral')

## 5. Implementation Strategy

### Phase 1: Infrastructure

- Configure D1 binding in `wrangler.jsonc`.
- Run initial migrations to create the schema.
- Setup `.env` with Evolution API Base URL and Global Key.

### Phase 2: Core Services

- Implement `EvolutionService` using the documentation in `docs/EVOLUTION-API.md`.
- Build the `EventOrchestrator` to handle incoming messages and identify contacts.

### Phase 3: AI & Persistence

- Connect `AIService` for automated insights.
- Replace all frontend `LEADS` imports with TanStack Query calls to the new D1-backed API.

### Phase 4: Referrals & Polishing

- Implement the "Encaminhar" (Forward) logic.
- Add UI for prompt management and AI toggles.

## 6. Verification Plan

- **Unit Tests:** Validate `EvolutionService` mapping of JIDs and message types.
- **Integration Tests:** Use a test instance of Evolution API to confirm webhook receipt and DB persistence.
- **Manual Check:** Verify in the Dashboard if new real messages appear in the correct categories.
