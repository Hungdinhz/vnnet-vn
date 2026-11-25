package com.example.backend_java.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseConstraintMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConstraintMigrationRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public DatabaseConstraintMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            log.info("Ensuring case-insensitive uniqueness on users.username...");
            // Khử trùng lặp username hiện có (nếu có) bằng cách gắn hậu tố _id trước khi tạo unique index
            jdbcTemplate.execute("""
                WITH duplicates AS (
                    SELECT id, username,
                           ROW_NUMBER() OVER (PARTITION BY LOWER(username) ORDER BY id ASC) AS rn
                    FROM users
                )
                UPDATE users u
                SET username = LEFT(d.username, 40) || '_' || d.id
                FROM duplicates d
                WHERE u.id = d.id AND d.rn > 1;
            """);

            jdbcTemplate.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower ON users (LOWER(username));"
            );
            log.info("Case-insensitive unique index on users.username verified.");
        } catch (Exception e) {
            log.warn("Could not enforce unique index on username: {}", e.getMessage());
        }
    }
}
