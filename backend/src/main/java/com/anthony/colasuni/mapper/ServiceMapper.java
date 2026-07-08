package com.anthony.colasuni.mapper;

import com.anthony.colasuni.dto.service.ServiceResponse;
import com.anthony.colasuni.entity.ServiceEntity;

public class ServiceMapper {

    public static ServiceResponse toResponse(ServiceEntity service) {
        if (service == null) return null;
        return ServiceResponse.builder()
                .id(service.getId())
                .name(service.getName())
                .description(service.getDescription())
                .prefix(service.getPrefix())
                .ticketSequence(service.getTicketSequence())
                .active(service.isActive())
                .assignedOperator(UserMapper.toSummary(service.getAssignedOperator()))
                .createdAt(service.getCreatedAt())
                .build();
    }
}
