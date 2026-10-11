package com.farmely.identity.service;

import com.farmely.identity.dto.AuthResponse;
import com.farmely.identity.dto.LoginRequest;
import com.farmely.identity.dto.RegisterRequest;
import com.farmely.identity.dto.UserResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    UserResponse getCurrentUser(String email);
}
