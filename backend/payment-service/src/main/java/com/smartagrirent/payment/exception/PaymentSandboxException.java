package com.smartagrirent.payment.exception;

public class PaymentSandboxException extends RuntimeException {
    private final String errorCode;

    public PaymentSandboxException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
