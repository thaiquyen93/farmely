package com.farmely.cultivation.entity;

public enum IssueStatus {
    OPEN,
    RESOLVED;

    public static IssueStatus fromString(String val) {
        if (val == null) return OPEN;
        String upper = val.trim().toUpperCase();
        if (upper.equals("SOLVED_BY_EXPERT") || upper.equals("SOLVED")) return RESOLVED;
        try {
            return IssueStatus.valueOf(upper);
        } catch (IllegalArgumentException e) {
            return OPEN;
        }
    }
}
