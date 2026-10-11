package com.farmely.identity.service.impl;

import com.farmely.identity.config.JwtTokenProvider;
import com.farmely.identity.dto.AuthResponse;
import com.farmely.identity.dto.LoginRequest;
import com.farmely.identity.dto.RegisterRequest;
import com.farmely.identity.dto.UserResponse;
import com.farmely.identity.entity.Role;
import com.farmely.identity.entity.User;
import com.farmely.identity.entity.UserStatus;
import com.farmely.identity.exception.AppException;
import com.farmely.identity.exception.ResourceNotFoundException;
import com.farmely.identity.mapper.UserMapper;
import com.farmely.identity.repository.RoleRepository;
import com.farmely.identity.repository.UserRepository;
import com.farmely.identity.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new AppException("Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException("Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED);
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new AppException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", HttpStatus.FORBIDDEN);
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new AppException("Tài khoản chưa được kích hoạt.", HttpStatus.FORBIDDEN);
        }

        String token = tokenProvider.generateToken(user);
        UserResponse userResponse = userMapper.toUserResponse(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpiration())
                .user(userResponse)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new AppException("Email này đã được đăng ký trong hệ thống", HttpStatus.CONFLICT);
        }

        String targetRoleName = (request.getRoleName() != null && !request.getRoleName().isBlank())
                ? request.getRoleName().trim().toUpperCase()
                : "CUSTOMER";

        Role role = roleRepository.findByRoleName(targetRoleName)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò: " + targetRoleName));

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Đã tạo mới tài khoản thành công: email={}, role={}", savedUser.getEmail(), role.getRoleName());

        String token = tokenProvider.generateToken(savedUser);
        UserResponse userResponse = userMapper.toUserResponse(savedUser);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpiration())
                .user(userResponse)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng"));
        return userMapper.toUserResponse(user);
    }
}
