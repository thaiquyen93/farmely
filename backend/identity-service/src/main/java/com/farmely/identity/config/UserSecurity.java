package com.farmely.identity.config;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("userSecurity")
public class UserSecurity {

    public boolean canAccessUser(Authentication authentication, Integer userId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        // Admin có toàn quyền xem và quản lý mọi user
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return true;
        }

        // User bình thường chỉ được phép truy cập đúng ID của chính mình
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUser().getUserId() != null 
                    && userDetails.getUser().getUserId().equals(userId);
        }

        return false;
    }
}
