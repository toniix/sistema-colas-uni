package com.anthony.colasuni.repository;

import com.anthony.colasuni.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("SELECT t FROM Ticket t WHERE t.service.id = :serviceId AND t.status = 'EN_COLA' " +
           "ORDER BY CASE WHEN t.type = 'PREFERENCIAL' THEN 0 ELSE 1 END ASC, t.createdAt ASC")
    List<Ticket> findNextInQueue(@Param("serviceId") Long serviceId, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE t.student.id = :studentId AND t.service.id = :serviceId " +
           "AND t.status IN ('CREADO', 'EN_COLA', 'LLAMADO', 'EN_ATENCION')")
    Optional<Ticket> findActiveTicketByStudentAndService(@Param("studentId") Long studentId, @Param("serviceId") Long serviceId);

    @Query("SELECT t FROM Ticket t WHERE t.operator.id = :operatorId " +
           "AND t.status IN ('LLAMADO', 'EN_ATENCION')")
    Optional<Ticket> findActiveTicketByOperator(@Param("operatorId") Long operatorId);

    @Query("SELECT t FROM Ticket t WHERE t.service.id = :serviceId AND t.status = 'EN_COLA' " +
           "ORDER BY CASE WHEN t.type = 'PREFERENCIAL' THEN 0 ELSE 1 END ASC, t.createdAt ASC")
    List<Ticket> findQueueByService(@Param("serviceId") Long serviceId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.service.id = :serviceId AND t.status = 'EN_COLA'")
    long countQueueByService(@Param("serviceId") Long serviceId);

    List<Ticket> findByStudentId(Long studentId);

    Page<Ticket> findAll(Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE t.createdAt >= :startDate AND t.createdAt <= :endDate")
    List<Ticket> findTicketsInDateRange(@Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);

}
