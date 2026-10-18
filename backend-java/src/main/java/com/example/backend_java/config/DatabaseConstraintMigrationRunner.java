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
            log.info("Removing any unique constraints on users.username...");
            jdbcTemplate.execute("""
                DO $$
                DECLARE
                    r RECORD;
                BEGIN
                    FOR r IN (
                        SELECT tc.constraint_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
                        WHERE tc.table_name = 'users'
                          AND ccu.column_name = 'username'
                          AND tc.constraint_type = 'UNIQUE'
                    ) LOOP
                        RAISE NOTICE 'Dropping constraint %', r.constraint_name;
                        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
                    END LOOP;
                END $$;
            """);

            jdbcTemplate.execute("""
                DO $$
                DECLARE
                    idx RECORD;
                BEGIN
                    FOR idx IN (
                        SELECT indexname
                        FROM pg_indexes
                        WHERE tablename = 'users'
                          AND indexname LIKE '%username%'
                          AND indexdef LIKE '%UNIQUE%'
                    ) LOOP
                        RAISE NOTICE 'Dropping unique index %', idx.indexname;
                        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(idx.indexname);
                    END LOOP;
                END $$;
            """);
            log.info("Unique constraints on users.username successfully dropped.");
        } catch (Exception e) {
            log.warn("Could not drop unique constraint on username: {}", e.getMessage());
        }
    }
}
