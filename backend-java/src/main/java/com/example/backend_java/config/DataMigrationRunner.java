package com.example.backend_java.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DataMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public DataMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Fix null reaction_type cho likes cũ
        int updated = jdbcTemplate.update(
                "UPDATE likes SET reaction_type = 'like' WHERE reaction_type IS NULL");
        if (updated > 0) {
            System.out.println("[DataMigration] Updated " + updated + " likes with null reaction_type -> 'like'");
        }
    }
}
