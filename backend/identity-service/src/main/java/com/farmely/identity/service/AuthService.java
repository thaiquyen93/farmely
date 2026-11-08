package com.farmely.identity.service;

import com.farmely.identity.dto.AuthResponse;
import com.farmely.identity.dto.LoginRequest;
import com.farmely.identity.dto.RegisterRequest;
import com.farmely.identity.dto.UserResponse;

import com.farmely.identity.dto.ForgotPasswordRequest;
import com.farmely.identity.dto.ResetPasswordRequest;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    UserResponse getCurrentUser(String email);
    String forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
