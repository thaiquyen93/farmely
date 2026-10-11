package com.farmely.identity.service;

import com.farmely.identity.dto.ChangePasswordRequest;
import com.farmely.identity.dto.UpdateUserRequest;
import com.farmely.identity.dto.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Integer id);
    UserResponse updateProfile(Integer id, UpdateUserRequest request);
    void changePassword(Integer id, ChangePasswordRequest request);
    UserResponse changeStatus(Integer id, String status);
}
