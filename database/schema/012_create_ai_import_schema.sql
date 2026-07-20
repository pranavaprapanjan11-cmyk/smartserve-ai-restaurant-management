-- File: database/schema/012_create_ai_import_schema.sql
-- PostgreSQL schema for Phase J: AI Smart Import Center Logs & Telemetry

CREATE TABLE IF NOT EXISTS ai_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('MENU', 'INVENTORY', 'PANTRY', 'INVOICE', 'HANDWRITTEN')),
  original_file_name VARCHAR(255),
  original_file_path TEXT,
  ai_raw_response JSONB DEFAULT '{}'::jsonb,
  final_imported_data JSONB DEFAULT '{}'::jsonb,
  user_corrections JSONB DEFAULT '{}'::jsonb,
  confidence_score DECIMAL(5,2) DEFAULT 0.00,
  processing_time_ms INTEGER DEFAULT 0,
  ocr_fallback_used BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IMPORTED', 'FAILED')),
  imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexing for fast search and analytics reads
CREATE INDEX IF NOT EXISTS idx_ai_imports_restaurant_id ON ai_imports(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ai_imports_workspace_id ON ai_imports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_imports_type ON ai_imports(import_type);
CREATE INDEX IF NOT EXISTS idx_ai_imports_status ON ai_imports(status);

-- Register multi-workspace partitioning trigger
CREATE OR REPLACE TRIGGER trigger_populate_workspace_id_ai_imports
BEFORE INSERT ON ai_imports
FOR EACH ROW
EXECUTE FUNCTION populate_workspace_id_trigger_fn();
