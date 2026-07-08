package com.anthony.colasuni.repository;

import com.anthony.colasuni.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {

    Optional<ServiceEntity> findByAssignedOperatorId(Long operatorId);

    boolean existsByPrefix(String prefix);

    boolean existsByName(String name);
}
