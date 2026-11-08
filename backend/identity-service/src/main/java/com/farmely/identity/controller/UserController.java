package com.farmely.identity.controller;

import com.farmely.identity.dto.ApiResponse;
import com.farmely.identity.dto.ChangePasswordRequest;
import com.farmely.identity.dto.UpdateUserRequest;
import com.farmely.identity.dto.UserResponse;
import com.farmely.identity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "APIs quản lý người dùng")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    @Operation(summary = "Lấy danh sách người dùng", description = "Chỉ Admin và Chuyên gia được phép xem")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@userSecurity.canAccessUser(authentication, #id)")
    @Operation(summary = "Lấy thông tin người dùng theo ID", description = "Chỉ Admin hoặc chính chủ tài khoản mới được xem")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Integer id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@userSecurity.canAccessUser(authentication, #id)")
    @Operation(summary = "Cập nhật thông tin cá nhân", description = "Chỉ Admin hoặc chính chủ tài khoản mới được cập nhật")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse user = userService.updateProfile(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin thành công", user));
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("@userSecurity.canAccessUser(authentication, #id)")
    @Operation(summary = "Đổi mật khẩu", description = "Chỉ Admin hoặc chính chủ tài khoản mới được đổi")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable Integer id,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Đổi mật khẩu thành công", null));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Đổi trạng thái tài khoản (ACTIVE, INACTIVE, BLOCKED)", description = "Chỉ Admin được phép thao tác")
    public ResponseEntity<ApiResponse<UserResponse>> changeStatus(
            @PathVariable Integer id,
            @RequestParam String status) {
        UserResponse user = userService.changeStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công", user));
    }
}
