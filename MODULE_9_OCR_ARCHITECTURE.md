# Module 9 — OCR Architecture (Draft)

Goal: Add OCR capabilities to extract text from images (receipts, menus, invoices) and integrate with AI engine for semantic understanding and downstream automations.

High-level components:

- OCR Ingestion Service (microservice)
  - Receives image uploads (multipart/form-data or URL) via authenticated API.
  - Stores original images in object storage (S3-compatible) and creates processing jobs.
  - Publishes job to a queue (RabbitMQ / Redis Stream / SQS).

- OCR Processor Workers
  - Pull jobs from queue and run OCR using selected engine.
  - Engines considered:
    - Tesseract (open-source) — good offline option, configurable for languages.
    - Google Cloud Vision / AWS Textract / Azure OCR — managed, higher accuracy for receipts/invoices, cost tradeoffs.
    - ML-based layout parsers (Donut, TrOCR) for structured documents.
  - Post-processing steps: language detection, OCR confidence thresholding, layout extraction, table/line parsing.
  - Save structured output (JSON) in DB and raw text in object store.

- AI Enrichment Pipeline
  - Use semantic models to extract entities (merchant, total, tax, date) and map to domain models.
  - Run validation rules and normalizations.
  - Persist normalized entities to `invoices`, `orders`, or `inventory` as applicable.

- Admin/Operator UI
  - Queue dashboard (job status, retries, failure reasons)
  - Manual correction UI for low-confidence results
  - Bulk review and accept/merge flows

- Data Model
  - `ocr_jobs` table: id, restaurant_id, file_url, status, engine, confidence, result_url, created_at, updated_at
  - `ocr_results` table: id, job_id, raw_text, structured_json, entities, confidence

- Security and Privacy
  - Images and extracted text are treated as sensitive; encrypt at rest and in transit.
  - Access controls tied to restaurant_id and user roles.
  - Retention policy configurable per-restaurant.

- Scalability
  - Use autoscaling worker pool driven by queue length.
  - Optimize for batch inference when using cloud APIs to reduce cost.

- Observability
  - Metrics: jobs/sec, avg latency, error rates, OCR confidence distribution.
  - Logs: structured logs with job_id correlation.

- Cost and accuracy tradeoffs
  - Start with Tesseract + heuristic post-processing for MVP to avoid cloud costs.
  - Offer cloud OCR as a premium option toggled per-restaurant.

- Integration Points
  - Invoices: auto-create invoice drafts from receipt OCR.
  - Orders: map menu items recognized on printed receipts to menu catalog for POS reconciliation.
  - Accounting: export structured transactions to billing module.

Next steps to implement MVP:

1. Add `ocr_jobs` + `ocr_results` DB tables (migration).
2. Implement API endpoint to upload images and create job.
3. Add simple worker using Tesseract (docker image) to process jobs and store results.
4. Add admin UI for reviewing OCR outputs and linking to invoices/orders.
5. Evaluate cloud OCR for improved accuracy and add as optional provider.

This is a draft — I can expand any section into implementation tasks, migrations, or initial code scaffolding if you want to proceed.
