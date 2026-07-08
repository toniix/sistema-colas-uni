package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.service.ServiceRequest;
import com.anthony.colasuni.dto.service.ServiceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ServiceManagementService {

    Page<ServiceResponse> getAllServices(Pageable pageable);

    ServiceResponse getServiceById(Long id);

    ServiceResponse createService(ServiceRequest request);

    ServiceResponse updateService(Long id, ServiceRequest request);

    void deleteService(Long id);

    ServiceResponse assignOperator(Long serviceId, Long operatorId);
}
