-- V2: Admin Portal RBAC, Audit Logs, Content Reports & Soft-Hide Moderation
-- Idempotent migration for PostgreSQL (required before deploying to production with hibernate.ddl-auto: validate)

-- 1. Extend users table for RBAC and Account Status
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL;

UPDATE users SET role = 'USER' WHERE role IS NULL;
UPDATE users SET account_status = 'ACTIVE' WHERE account_status IS NULL;
UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 2. Update verification_tokens check constraint for ADMIN_LOGIN_OTP
ALTER TABLE verification_tokens DROP CONSTRAINT IF EXISTS verification_tokens_token_type_check;
ALTER TABLE verification_tokens ADD CONSTRAINT verification_tokens_token_type_check
    CHECK (token_type IN ('REGISTER_VERIFICATION', 'PASSWORD_RESET', 'ADMIN_LOGIN_OTP'));

-- 3. Immutable Admin Audit Logs (append-only)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    actor_email VARCHAR(100) NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(60) NOT NULL,
    target_type VARCHAR(40) NOT NULL,
    target_id BIGINT NULL,
    reason TEXT NULL,
    metadata_json TEXT NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);

-- 4. Content Reports Queue
CREATE TABLE IF NOT EXISTS content_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL,
    target_id BIGINT NOT NULL,
    reason_category VARCHAR(40) NOT NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    handled_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
    resolution_note TEXT NULL,
    action_taken VARCHAR(40) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status_created ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_target ON content_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);

-- 5. Soft-hide moderation columns on content tables
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hidden_reason TEXT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hidden_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_reason TEXT NULL;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP NULL;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE app_groups ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE app_groups ADD COLUMN IF NOT EXISTS hidden_reason TEXT NULL;
ALTER TABLE app_groups ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP NULL;
ALTER TABLE app_groups ADD COLUMN IF NOT EXISTS hidden_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS hidden_reason TEXT NULL;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP NULL;
ALTER TABLE marketplace_items ADD COLUMN IF NOT EXISTS hidden_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_comments_is_hidden ON comments(is_hidden);
CREATE INDEX IF NOT EXISTS idx_app_groups_is_hidden ON app_groups(is_hidden);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_is_hidden ON marketplace_items(is_hidden);
