package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.auth.AuthResponse;
import com.anthony.colasuni.dto.auth.LoginRequest;
import com.anthony.colasuni.dto.auth.RefreshTokenRequest;
import com.anthony.colasuni.dto.auth.RegisterUserRequest;
import com.anthony.colasuni.dto.user.UserResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    UserResponse register(RegisterUserRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(String authHeader);
}
