package com.anthony.colasuni.controller;

import com.anthony.colasuni.dto.service.ServiceRequest;
import com.anthony.colasuni.dto.service.ServiceResponse;
import com.anthony.colasuni.service.ServiceManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceManagementService serviceManagementService;

    @GetMapping
    public ResponseEntity<Page<ServiceResponse>> getAllServices(Pageable pageable) {
        return ResponseEntity.ok(serviceManagementService.getAllServices(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceResponse> getServiceById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceManagementService.getServiceById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceResponse> createService(@Valid @RequestBody ServiceRequest request) {
        return new ResponseEntity<>(serviceManagementService.createService(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceResponse> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequest request
    ) {
        return ResponseEntity.ok(serviceManagementService.updateService(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        serviceManagementService.deleteService(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/assign-operator")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceResponse> assignOperator(
            @PathVariable Long id,
            @RequestParam(required = false) Long operatorId
    ) {
        return ResponseEntity.ok(serviceManagementService.assignOperator(id, operatorId));
    }
}
