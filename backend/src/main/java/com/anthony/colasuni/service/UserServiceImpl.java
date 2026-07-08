package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.user.UserResponse;
import com.anthony.colasuni.dto.user.UserUpdateRequest;
import com.anthony.colasuni.entity.User;
import com.anthony.colasuni.enums.AuditAction;
import com.anthony.colasuni.exception.BusinessException;
import com.anthony.colasuni.exception.ResourceNotFoundException;
import com.anthony.colasuni.mapper.UserMapper;
import com.anthony.colasuni.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        return UserMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("El correo electrónico ya está en uso por otro usuario", HttpStatus.BAD_REQUEST);
        }

        User oldUser = User.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .enabled(user.isEnabled())
                .build();

        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setEnabled(request.isEnabled());

        User updatedUser = userRepository.save(user);

        auditService.logAction(AuditAction.USER_UPDATED, "User", updatedUser.getId(), oldUser, updatedUser, "Usuario actualizado: " + updatedUser.getUsername(), com.anthony.colasuni.enums.AuditResult.OK);

        return UserMapper.toResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        userRepository.delete(user);
        auditService.logAction(AuditAction.USER_DELETED, "User", id, user, null, "Usuario eliminado: " + user.getUsername(), com.anthony.colasuni.enums.AuditResult.OK);
    }

    @Override
    @Transactional
    public UserResponse toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        boolean oldStatus = user.isEnabled();
        user.setEnabled(!oldStatus);

        User updatedUser = userRepository.save(user);
        auditService.logAction(AuditAction.USER_UPDATED, "User", updatedUser.getId(), "Habilitado: " + oldStatus, "Habilitado: " + !oldStatus, "Cambio de estado de habilitación para: " + updatedUser.getUsername(), com.anthony.colasuni.enums.AuditResult.OK);

        return UserMapper.toResponse(updatedUser);
    }

}
