package com.example.backend_java.entity;

public enum Role {
    USER,
    MODERATOR,
    ADMIN,
    SUPER_ADMIN;

    public boolean isStaff() {
        return this == MODERATOR || this == ADMIN || this == SUPER_ADMIN;
    }

    public int rank() {
        return switch (this) {
            case USER -> 0;
            case MODERATOR -> 1;
            case ADMIN -> 2;
            case SUPER_ADMIN -> 3;
        };
    }
}
