package com.farmely.identity.service.impl;

import com.farmely.identity.config.JwtTokenProvider;
import com.farmely.identity.dto.RegisterRequest;
import com.farmely.identity.exception.AppException;
import com.farmely.identity.mapper.UserMapper;
import com.farmely.identity.repository.PasswordResetTokenRepository;
import com.farmely.identity.repository.RoleRepository;
import com.farmely.identity.repository.UserRepository;
import com.farmely.identity.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider tokenProvider;
    @Mock UserMapper userMapper;
    @Mock AuditLogService auditLogService;
    @InjectMocks AuthServiceImpl authService;

    @Test
    void publicRegistrationCannotChooseAdminRole() {
        RegisterRequest request = RegisterRequest.builder()
                .email("new-admin@example.com")
                .password("secret123")
                .fullName("New Admin")
                .roleName("ADMIN")
                .build();

        AppException error = assertThrows(AppException.class, () -> authService.register(request));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        verify(roleRepository, never()).findByRoleName("ADMIN");
    }
}
