package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.auth.AuthResponse;
import com.anthony.colasuni.dto.auth.LoginRequest;
import com.anthony.colasuni.dto.auth.RefreshTokenRequest;
import com.anthony.colasuni.dto.auth.RegisterUserRequest;
import com.anthony.colasuni.dto.user.UserResponse;
import com.anthony.colasuni.dto.user.UserSummaryDTO;
import com.anthony.colasuni.entity.RefreshToken;
import com.anthony.colasuni.entity.User;
import com.anthony.colasuni.enums.AuditAction;
import com.anthony.colasuni.exception.BusinessException;
import com.anthony.colasuni.exception.ResourceNotFoundException;
import com.anthony.colasuni.mapper.UserMapper;
import com.anthony.colasuni.repository.RefreshTokenRepository;
import com.anthony.colasuni.repository.UserRepository;
import com.anthony.colasuni.security.CustomUserDetailsService;
import com.anthony.colasuni.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final AuditService auditService;

    @Value("${application.security.jwt.refresh-expiration:604800000}") // 7 días en ms
    private long refreshExpirationMs;

    @Override
    public AuthResponse login(LoginRequest request) {
        System.out.println(request.getUsername());
        System.out.println(request.getPassword());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

            if (!user.isEnabled()) {
                throw new BusinessException("El usuario está deshabilitado", HttpStatus.FORBIDDEN);
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            String accessToken = jwtService.generateToken(userDetails);
            RefreshToken refreshToken = createRefreshToken(user);

            UserSummaryDTO summary = UserMapper.toSummary(user);

            auditService.logAction(AuditAction.LOGIN, "User", user.getId(), null, null, "Inicio de sesión exitoso",
                    user, com.anthony.colasuni.enums.AuditResult.OK);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken.getToken())
                    .expiresIn(jwtService.getExpirationTime())
                    .user(summary)
                    .build();
        } catch (Exception ex) {
            User user = userRepository.findByUsername(request.getUsername()).orElse(null);
            auditService.logAction(AuditAction.LOGIN, "User", user != null ? user.getId() : 0L, null, null,
                    "Intento de inicio de sesión fallido para: " + request.getUsername() + ". Detalle: "
                            + ex.getMessage(),
                    user, com.anthony.colasuni.enums.AuditResult.ERROR);
            throw ex;
        }
    }

    @Override
    @Transactional
    public UserResponse register(RegisterUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("El nombre de usuario ya existe", HttpStatus.BAD_REQUEST);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("El correo electrónico ya existe", HttpStatus.BAD_REQUEST);
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);

        auditService.logAction(AuditAction.USER_CREATED, "User", savedUser.getId(), null, savedUser,
                "Usuario registrado: " + savedUser.getUsername(), com.anthony.colasuni.enums.AuditResult.OK);

        return UserMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BusinessException("Refresh token no encontrado", HttpStatus.UNAUTHORIZED));

        if (token.isRevoked()) {
            throw new BusinessException("Refresh token revocado", HttpStatus.UNAUTHORIZED);
        }

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new BusinessException("Refresh token expirado. Por favor, inicie sesión nuevamente.",
                    HttpStatus.UNAUTHORIZED);
        }

        User user = token.getUser();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());

        // Rotar tokens: invalidar el actual y crear uno nuevo
        refreshTokenRepository.delete(token);
        RefreshToken newRefreshToken = createRefreshToken(user);
        String newAccessToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .expiresIn(jwtService.getExpirationTime())
                .user(UserMapper.toSummary(user))
                .build();
    }

    @Override
    @Transactional
    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String username = jwtService.extractUsername(token);
            userRepository.findByUsername(username).ifPresent(user -> {
                refreshTokenRepository.deleteByUser_Id(user.getId());
                auditService.logAction(AuditAction.LOGOUT, "User", user.getId(), null, null, "Cierre de sesión exitoso",
                        user, com.anthony.colasuni.enums.AuditResult.OK);
            });
        }
    }

    private RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }
}
