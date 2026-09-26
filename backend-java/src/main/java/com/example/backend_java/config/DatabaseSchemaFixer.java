package com.example.backend_java.config;

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
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size BIGINT;");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id BIGINT REFERENCES messages(id);");
            jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;");
            log.info("Successfully verified message table schema columns");
        } catch (Exception e) {
            log.warn("Error checking message table schema columns: {}", e.getMessage());
        }
    }
}
