package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.service.ServiceRequest;
import com.anthony.colasuni.dto.service.ServiceResponse;
import com.anthony.colasuni.entity.ServiceEntity;
import com.anthony.colasuni.entity.User;
import com.anthony.colasuni.enums.AuditAction;
import com.anthony.colasuni.enums.AuditResult;
import com.anthony.colasuni.enums.RoleEnum;
import com.anthony.colasuni.exception.DuplicateServiceException;
import com.anthony.colasuni.exception.ResourceNotFoundException;
import com.anthony.colasuni.mapper.ServiceMapper;
import com.anthony.colasuni.repository.ServiceRepository;
import com.anthony.colasuni.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.anthony.colasuni.exception.BusinessException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ServiceManagementServiceImpl implements ServiceManagementService {

    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public Page<ServiceResponse> getAllServices(Pageable pageable) {
        return serviceRepository.findAll(pageable).map(ServiceMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceResponse getServiceById(Long id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado con ID: " + id));
        return ServiceMapper.toResponse(service);
    }

    @Override
    @Transactional
    public ServiceResponse createService(ServiceRequest request) {
        if (serviceRepository.existsByName(request.getName())) {
            throw new DuplicateServiceException("Ya existe un servicio con el nombre: " + request.getName());
        }
        if (serviceRepository.existsByPrefix(request.getPrefix().toUpperCase())) {
            throw new DuplicateServiceException("Ya existe un servicio con el prefijo: " + request.getPrefix().toUpperCase());
        }

        User operator = resolveOperator(request.getAssignedOperatorId(), null);

        ServiceEntity service = ServiceEntity.builder()
                .name(request.getName())
                .description(request.getDescription())
                .prefix(request.getPrefix().toUpperCase())
                .ticketSequence(0L)
                .assignedOperator(operator)
                .active(true)
                .build();

        ServiceEntity savedService = serviceRepository.save(service);

        auditService.logAction(AuditAction.UPDATE, "ServiceEntity", savedService.getId(),
                null, savedService, "Servicio creado: " + savedService.getName(), AuditResult.OK);

        return ServiceMapper.toResponse(savedService);
    }

    @Override
    @Transactional
    public ServiceResponse updateService(Long id, ServiceRequest request) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado con ID: " + id));

        if (!service.getName().equalsIgnoreCase(request.getName())
                && serviceRepository.existsByName(request.getName())) {
            throw new DuplicateServiceException("Ya existe otro servicio con el nombre: " + request.getName());
        }
        if (!service.getPrefix().equalsIgnoreCase(request.getPrefix())
                && serviceRepository.existsByPrefix(request.getPrefix().toUpperCase())) {
            throw new DuplicateServiceException("Ya existe otro servicio con el prefijo: " + request.getPrefix().toUpperCase());
        }

        User operator = resolveOperator(request.getAssignedOperatorId(), id);

        ServiceEntity oldService = ServiceEntity.builder()
                .name(service.getName())
                .description(service.getDescription())
                .prefix(service.getPrefix())
                .assignedOperator(service.getAssignedOperator())
                .build();

        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setPrefix(request.getPrefix().toUpperCase());
        service.setAssignedOperator(operator);

        ServiceEntity updatedService = serviceRepository.save(service);

        auditService.logAction(AuditAction.UPDATE, "ServiceEntity", updatedService.getId(),
                oldService, updatedService, "Servicio actualizado: " + updatedService.getName(), AuditResult.OK);

        return ServiceMapper.toResponse(updatedService);
    }

    @Override
    @Transactional
    public void deleteService(Long id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado con ID: " + id));

        serviceRepository.delete(service);
        auditService.logAction(AuditAction.DELETE, "ServiceEntity", id,
                service, null, "Servicio eliminado: " + service.getName(), AuditResult.OK);
    }

    @Override
    @Transactional
    public ServiceResponse assignOperator(Long serviceId, Long operatorId) {
        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado con ID: " + serviceId));

        User operator = resolveOperator(operatorId, serviceId);

        User oldOperator = service.getAssignedOperator();
        service.setAssignedOperator(operator);
        ServiceEntity updatedService = serviceRepository.save(service);

        auditService.logAction(AuditAction.UPDATE, "ServiceEntity", serviceId,
                oldOperator != null ? oldOperator.getUsername() : "Ninguno",
                operator != null ? operator.getUsername() : "Ninguno",
                "Operador asignado al servicio: " + service.getName(), AuditResult.OK);

        return ServiceMapper.toResponse(updatedService);
    }

    // ──────────────────────────────────────────────────────────────
    // Helper: resuelve y valida el operador asignado
    // ──────────────────────────────────────────────────────────────

    private User resolveOperator(Long operatorId, Long currentServiceId) {
        if (operatorId == null) return null;

        User operator = userRepository.findById(operatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Operador no encontrado con ID: " + operatorId));

        if (operator.getRole() != RoleEnum.OPERATOR) {
            throw new BusinessException("El usuario asignado debe tener el rol OPERATOR", HttpStatus.BAD_REQUEST);
        }

        Optional<ServiceEntity> existingService = serviceRepository.findByAssignedOperatorId(operatorId);
        if (existingService.isPresent()
                && (currentServiceId == null || !existingService.get().getId().equals(currentServiceId))) {
            throw new BusinessException("El operador seleccionado ya está asignado a otro servicio", HttpStatus.BAD_REQUEST);
        }

        return operator;
    }
}
