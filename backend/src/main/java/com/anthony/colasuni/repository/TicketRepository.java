package com.anthony.colasuni.repository;

import com.anthony.colasuni.entity.Ticket;
import com.anthony.colasuni.enums.TicketStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    /**
     * Busca el siguiente turno en cola para un servicio,
     * ordenado por prioridad DESC (PREFERENTE primero) y luego por posición ASC (FIFO).
     * Usado por callNextTicket() con PageRequest.of(0,1).
     */
    @Query("SELECT t FROM Ticket t WHERE t.service.id = :serviceId AND t.status = 'IN_QUEUE' " +
           "ORDER BY CASE WHEN t.priority = 'PREFERENTE' THEN 0 ELSE 1 END ASC, t.position ASC")
    List<Ticket> findNextInQueue(@Param("serviceId") Long serviceId, Pageable pageable);

    /**
     * Obtiene el siguiente turno (primer resultado) en cola para un servicio.
     * PREFERENTE tiene prioridad; entre misma prioridad se respeta orden de llegada (FIFO).
     */
    @Query("SELECT t FROM Ticket t WHERE t.service.id = :serviceId AND t.status = 'IN_QUEUE' " +
           "ORDER BY CASE WHEN t.priority = 'PREFERENTE' THEN 0 ELSE 1 END ASC, t.position ASC")
    List<Ticket> getNextTicket(@Param("serviceId") Long serviceId, Pageable pageable);

    /**
     * Verifica si un estudiante ya tiene un turno activo en un servicio determinado.
     */
    @Query("SELECT t FROM Ticket t WHERE t.student.id = :studentId AND t.service.id = :serviceId " +
           "AND t.status IN ('CREATED', 'IN_QUEUE', 'CALLED', 'IN_ATTENTION')")
    Optional<Ticket> findActiveTicketByStudentAndService(@Param("studentId") Long studentId,
                                                         @Param("serviceId") Long serviceId);

    /**
     * Busca el turno activo de un operador (en CALLED o IN_ATTENTION).
     */
    @Query("SELECT t FROM Ticket t WHERE t.operator.id = :operatorId " +
           "AND t.status IN ('CALLED', 'IN_ATTENTION')")
    List<Ticket> findActiveTicketByOperator(@Param("operatorId") Long operatorId);

    /**
     * Devuelve la cola activa de un servicio (status IN_QUEUE),
     * ordenada por prioridad y posición para mostrarse en pantalla.
     */
    @Query("SELECT t FROM Ticket t WHERE t.service.id = :serviceId AND t.status = 'IN_QUEUE' " +
           "ORDER BY CASE WHEN t.priority = 'PREFERENTE' THEN 0 ELSE 1 END ASC, t.position ASC")
    List<Ticket> findQueueByService(@Param("serviceId") Long serviceId);

    /**
     * Cuenta cuántos turnos hay actualmente en cola para un servicio.
     */
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.service.id = :serviceId AND t.status = 'IN_QUEUE'")
    long countQueueByService(@Param("serviceId") Long serviceId);

    /**
     * Busca el ticket actualmente CALLED o IN_ATTENTION de un servicio.
     */
    @Query("SELECT t FROM Ticket t WHERE t.service.id = :serviceId " +
           "AND t.status IN ('CALLED', 'IN_ATTENTION')")
    List<Ticket> findCurrentActiveByService(@Param("serviceId") Long serviceId);

    /**
     * Devuelve todos los tickets de un estudiante.
     */
    List<Ticket> findByStudentId(Long studentId);

    /**
     * Filtra tickets por rango de fechas de creación.
     */
    @Query("SELECT t FROM Ticket t WHERE t.createdAt >= :startDate AND t.createdAt <= :endDate")
    List<Ticket> findTicketsInDateRange(@Param("startDate") LocalDateTime startDate,
                                        @Param("endDate") LocalDateTime endDate);

    /**
     * Filtra tickets por estado.
     */
    List<Ticket> findByStatus(TicketStatus status);
}
