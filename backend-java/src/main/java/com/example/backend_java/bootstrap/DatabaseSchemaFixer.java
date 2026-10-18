package com.example.backend_java.bootstrap;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Running DatabaseSchemaFixer to ensure database constraints are up to date...");

        try {
            // 1. Drop NOT NULL on receiver_id to allow group chat messages
            jdbcTemplate.execute("ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL;");
            log.info("Successfully dropped NOT NULL constraint on messages.receiver_id");
        } catch (Exception e) {
            log.warn("Could not alter receiver_id column (may already be nullable): {}", e.getMessage());
        }

        try {
            // 2. Ensure all columns for file attachments, replies, and conversations exist
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE;");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'TEXT';");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT;");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size BIGINT;");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id BIGINT REFERENCES messages(id);");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;");

            // Update column types to TEXT in case they were previously VARCHAR(255)
            jdbcTemplate.execute("ALTER TABLE messages ALTER COLUMN image_url TYPE TEXT;");
            jdbcTemplate.execute("ALTER TABLE messages ALTER COLUMN file_url TYPE TEXT;");
            jdbcTemplate.execute("ALTER TABLE messages ALTER COLUMN file_name TYPE TEXT;");

            // Fix message_type check constraint to include FILE
            jdbcTemplate.execute("ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;");
            jdbcTemplate.execute("ALTER TABLE messages ADD CONSTRAINT messages_message_type_check CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'SYSTEM'));");

            // Ensure nickname column in conversation_members
            jdbcTemplate.execute("ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);");
            log.info("Successfully verified and updated message table schema columns");
        } catch (Exception e) {
            log.warn("Error checking message table schema columns: {}", e.getMessage());
        }

        try {
            // Ensure marketplace_items and seller_reviews tables exist
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS marketplace_items (
                    id BIGSERIAL PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    description TEXT NOT NULL,
                    price NUMERIC(15, 0) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    condition VARCHAR(30) NOT NULL DEFAULT 'used',
                    location VARCHAR(200),
                    image_urls TEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'active',
                    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    buyer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
                    views_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP
                );
            """);

            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS seller_reviews (
                    id BIGSERIAL PRIMARY KEY,
                    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    item_id BIGINT REFERENCES marketplace_items(id) ON DELETE SET NULL,
                    rating INT NOT NULL,
                    comment TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """);

            log.info("Successfully verified and created marketplace_items and seller_reviews tables");
        } catch (Exception e) {
            log.warn("Error checking marketplace tables: {}", e.getMessage());
        }
    }
}
