package com.farmely.identity.service.impl;

import com.farmely.identity.dto.ChangePasswordRequest;
import com.farmely.identity.dto.UpdateUserRequest;
import com.farmely.identity.dto.UserResponse;
import com.farmely.identity.entity.Role;
import com.farmely.identity.entity.User;
import com.farmely.identity.entity.UserStatus;
import com.farmely.identity.exception.AppException;
import com.farmely.identity.exception.ResourceNotFoundException;
import com.farmely.identity.mapper.UserMapper;
import com.farmely.identity.repository.RoleRepository;
import com.farmely.identity.repository.UserRepository;
import com.farmely.identity.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final com.farmely.identity.service.AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        return userMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(Integer id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        user.setFullName(request.getFullName().trim());
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }

        User updated = userRepository.save(user);
        return userMapper.toUserResponse(updated);
    }

    @Override
    @Transactional
    public void changePassword(Integer id, ChangePasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new AppException("Mật khẩu cũ không chính xác", HttpStatus.BAD_REQUEST);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditLogService.log(user.getUserId(), user.getEmail(), "CHANGE_PASSWORD", "USER", String.valueOf(user.getUserId()), "Đổi mật khẩu tài khoản thành công", null, "SUCCESS");
    }

    @Override
    @Transactional
    public UserResponse changeStatus(Integer id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        try {
            UserStatus newStatus = UserStatus.valueOf(status.trim().toUpperCase());
            user.setStatus(newStatus);
        } catch (IllegalArgumentException e) {
            throw new AppException("Trạng thái không hợp lệ: " + status, HttpStatus.BAD_REQUEST);
        }

        User updated = userRepository.save(user);
        auditLogService.log(user.getUserId(), user.getEmail(), "CHANGE_USER_STATUS", "USER", String.valueOf(user.getUserId()), "Thay đổi trạng thái tài khoản thành " + user.getStatus(), null, "SUCCESS");
        return userMapper.toUserResponse(updated);
    }

    @Override
    @Transactional
    public UserResponse changeRole(Integer id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        String raw = role == null ? "" : role.trim().toUpperCase();
        String targetRoleName;
        if ("STAFF".equals(raw) || "FIELD_WORKER".equals(raw)) {
            targetRoleName = roleRepository.findByRoleName("FIELD_WORKER").isPresent() ? "FIELD_WORKER" : "STAFF";
        } else if ("ADMIN".equals(raw) || "EXPERT".equals(raw) || "CUSTOMER".equals(raw)) {
            targetRoleName = raw;
        } else {
            throw new AppException("Vai trò không hợp lệ: " + role, HttpStatus.BAD_REQUEST);
        }

        String currentRoleName = user.getRole() != null ? user.getRole().getRoleName() : "";
        if ("ADMIN".equals(currentRoleName) && !"ADMIN".equals(targetRoleName)) {
            long remainingAdmins = userRepository.countByRoleRoleNameAndStatusAndUserIdNot("ADMIN", UserStatus.ACTIVE, id);
            if (remainingAdmins <= 0) {
                throw new AppException("Không thể hạ quyền Quản Trị Viên hoạt động cuối cùng của hệ thống.", HttpStatus.BAD_REQUEST);
            }
        }

        Role targetRole = roleRepository.findByRoleName(targetRoleName)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò: " + targetRoleName));

        user.setRole(targetRole);
        User updated = userRepository.save(user);
        auditLogService.log(
                user.getUserId(),
                user.getEmail(),
                "CHANGE_USER_ROLE",
                "USER",
                String.valueOf(user.getUserId()),
                "Phân quyền tài khoản từ " + currentRoleName + " sang " + targetRoleName,
                null,
                "SUCCESS"
        );
        return userMapper.toUserResponse(updated);
    }
}
