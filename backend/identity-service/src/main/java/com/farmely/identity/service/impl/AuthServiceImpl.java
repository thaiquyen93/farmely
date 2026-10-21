package com.farmely.identity.service.impl;

import com.farmely.identity.config.JwtTokenProvider;
import com.farmely.identity.dto.*;
import com.farmely.identity.entity.PasswordResetToken;
import com.farmely.identity.entity.Role;
import com.farmely.identity.entity.User;
import com.farmely.identity.entity.UserStatus;
import com.farmely.identity.exception.AppException;
import com.farmely.identity.exception.ResourceNotFoundException;
import com.farmely.identity.mapper.UserMapper;
import com.farmely.identity.repository.PasswordResetTokenRepository;
import com.farmely.identity.repository.RoleRepository;
import com.farmely.identity.repository.UserRepository;
import com.farmely.identity.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;
    private final com.farmely.identity.service.AuditLogService auditLogService;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new AppException("Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            auditLogService.log(user.getUserId(), user.getEmail(), "LOGIN", "USER", String.valueOf(user.getUserId()), "Đăng nhập thất bại (sai mật khẩu)", null, "FAILURE");
            throw new AppException("Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED);
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            auditLogService.log(user.getUserId(), user.getEmail(), "LOGIN", "USER", String.valueOf(user.getUserId()), "Đăng nhập bị chặn do tài khoản bị khóa", null, "FAILURE");
            throw new AppException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", HttpStatus.FORBIDDEN);
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            auditLogService.log(user.getUserId(), user.getEmail(), "LOGIN", "USER", String.valueOf(user.getUserId()), "Đăng nhập bị chặn do tài khoản chưa kích hoạt", null, "FAILURE");
            throw new AppException("Tài khoản chưa được kích hoạt.", HttpStatus.FORBIDDEN);
        }

        boolean isRememberMe = Boolean.TRUE.equals(request.getRememberMe());
        auditLogService.log(user.getUserId(), user.getEmail(), "LOGIN", "USER", String.valueOf(user.getUserId()),
                isRememberMe ? "Đăng nhập thành công (Ghi nhớ 14 ngày)" : "Đăng nhập thành công", null, "SUCCESS");

        String token = tokenProvider.generateToken(user, isRememberMe);
        UserResponse userResponse = userMapper.toUserResponse(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpiration(isRememberMe))
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
        auditLogService.log(savedUser.getUserId(), savedUser.getEmail(), "REGISTER", "USER", String.valueOf(savedUser.getUserId()), "Đăng ký tài khoản vai trò " + role.getRoleName(), null, "SUCCESS");
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

    @Override
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("Email này chưa được đăng ký trong hệ thống", HttpStatus.NOT_FOUND));

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new AppException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", HttpStatus.FORBIDDEN);
        }

        // Xóa các token cũ nếu có
        passwordResetTokenRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString().replace("-", "");
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(OffsetDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);
        auditLogService.log(user.getUserId(), user.getEmail(), "FORGOT_PASSWORD", "USER", String.valueOf(user.getUserId()), "Yêu cầu mã khôi phục mật khẩu", null, "SUCCESS");

        String resetUrl = "http://localhost:3000/reset-password?token=" + token;
        log.info("==================================================================");
        log.info("🔑 [PASSWORD RESET] Link khôi phục mật khẩu cho {}: {}", email, resetUrl);
        log.info("⏰ Token có hiệu lực 15 phút. Token: {}", token);
        log.info("==================================================================");

        return token;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenStr = request.getToken().trim();
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new AppException("Mã khôi phục không hợp lệ hoặc không tồn tại", HttpStatus.BAD_REQUEST));

        if (resetToken.isUsed()) {
            throw new AppException("Liên kết đặt lại mật khẩu này đã được sử dụng trước đó", HttpStatus.BAD_REQUEST);
        }

        if (resetToken.isExpired()) {
            throw new AppException("Liên kết đặt lại mật khẩu đã hết hạn (chỉ có hiệu lực trong 15 phút)", HttpStatus.BAD_REQUEST);
        }

        User user = resetToken.getUser();
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new AppException("Tài khoản đã bị khóa", HttpStatus.FORBIDDEN);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        auditLogService.log(user.getUserId(), user.getEmail(), "PASSWORD_RESET", "USER", String.valueOf(user.getUserId()), "Đặt lại mật khẩu thành công bằng token", null, "SUCCESS");

        log.info("✅ Đã đặt lại mật khẩu thành công cho tài khoản email={}", user.getEmail());
    }
}
