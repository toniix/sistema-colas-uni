package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.user.UserResponse;
import com.anthony.colasuni.dto.user.UserUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    Page<UserResponse> getAllUsers(Pageable pageable);

    UserResponse getUserById(Long id);

    UserResponse updateUser(Long id, UserUpdateRequest request);

    void deleteUser(Long id);

    UserResponse toggleUserStatus(Long id);
}
