package com.farmely.cultivation.entity;

public enum TaskStatus {
    PENDING,
    IN_PROG,
    DONE;

    public static TaskStatus fromString(String val) {
        if (val == null) return PENDING;
        String upper = val.trim().toUpperCase();
        if (upper.equals("IN_PROGRESS")) return IN_PROG;
        if (upper.equals("COMPLETED")) return DONE;
        try {
            return TaskStatus.valueOf(upper);
        } catch (IllegalArgumentException e) {
            return PENDING;
        }
    }
}
