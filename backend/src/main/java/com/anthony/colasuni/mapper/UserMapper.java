package com.anthony.colasuni.mapper;

import com.anthony.colasuni.dto.user.UserResponse;
import com.anthony.colasuni.dto.user.UserSummaryDTO;
import com.anthony.colasuni.entity.User;

public class UserMapper {

    public static UserResponse toResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public static UserSummaryDTO toSummary(User user) {
        if (user == null) return null;
        return UserSummaryDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
