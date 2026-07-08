package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.ticket.*;
import com.anthony.colasuni.entity.ServiceEntity;
import com.anthony.colasuni.entity.Ticket;
import com.anthony.colasuni.entity.User;
import com.anthony.colasuni.enums.AuditAction;
import com.anthony.colasuni.enums.RoleEnum;
import com.anthony.colasuni.enums.TicketStatus;
import com.anthony.colasuni.exception.BusinessException;
import com.anthony.colasuni.exception.DuplicateActiveTicketException;
import com.anthony.colasuni.exception.InvalidStateTransitionException;
import com.anthony.colasuni.exception.ResourceNotFoundException;
import com.anthony.colasuni.mapper.TicketMapper;
import com.anthony.colasuni.repository.ServiceRepository;
import com.anthony.colasuni.repository.TicketRepository;
import com.anthony.colasuni.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request) {
        User student = getCurrentUser();
        Long serviceId = request.getServiceId();
        try {
            ServiceEntity service = serviceRepository.findById(serviceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado"));

            if (!service.isActive()) {
                throw new BusinessException("El servicio no está activo en este momento", HttpStatus.BAD_REQUEST);
            }

            // Regla: Un estudiante solo puede tener 1 turno activo por servicio
            Optional<Ticket> activeTicket = ticketRepository.findActiveTicketByStudentAndService(student.getId(), serviceId);
            if (activeTicket.isPresent()) {
                throw new DuplicateActiveTicketException("Ya tienes un turno activo en el servicio de " + service.getName() + ": " + activeTicket.get().getTicketCode());
            }

            // Incrementar secuencia del servicio
            service.setTicketSequence(service.getTicketSequence() + 1);
            serviceRepository.save(service);

            String ticketCode = service.getPrefix() + "-" + service.getTicketSequence();

            // Calcular posición actual
            long queueCount = ticketRepository.countQueueByService(serviceId);
            int position = (int) queueCount + 1;

            Ticket ticket = Ticket.builder()
                    .ticketCode(ticketCode)
                    .status(TicketStatus.EN_COLA)
                    .type(request.getType())
                    .position(position)
                    .student(student)
                    .service(service)
                    .build();

            Ticket savedTicket = ticketRepository.save(ticket);

            auditService.logAction(AuditAction.TICKET_CREATED, "Ticket", savedTicket.getId(), null, savedTicket, "Turno creado: " + ticketCode, com.anthony.colasuni.enums.AuditResult.OK);

            return TicketMapper.toResponse(savedTicket);
        } catch (Exception ex) {
            auditService.logAction(AuditAction.TICKET_CREATED, "Ticket", 0L, null, null,
                    "Fallo al crear turno para servicio ID " + serviceId + ": " + ex.getMessage(), student, com.anthony.colasuni.enums.AuditResult.ERROR);
            throw ex;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado"));
        return TicketMapper.toResponse(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets() {
        User student = getCurrentUser();
        return ticketRepository.findByStudentId(student.getId()).stream()
                .map(TicketMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public TicketResponse callNextTicket() {
        User operator = getCurrentUser();
        try {
            // Buscar servicio asignado al operador
            ServiceEntity service = serviceRepository.findByAssignedOperatorId(operator.getId())
                    .orElseThrow(() -> new BusinessException("El operador no está asignado a ningún servicio", HttpStatus.BAD_REQUEST));

            // Regla: Un operador atiende solo un turno a la vez
            Optional<Ticket> activeOperatorTicket = ticketRepository.findActiveTicketByOperator(operator.getId());
            if (activeOperatorTicket.isPresent()) {
                throw new BusinessException("Ya tienes un turno activo en llamado o atención: " + activeOperatorTicket.get().getTicketCode(), HttpStatus.BAD_REQUEST);
            }

            // Buscar siguiente en cola (FIFO + Prioridad)
            List<Ticket> nextTickets = ticketRepository.findNextInQueue(service.getId(), PageRequest.of(0, 1));
            if (nextTickets.isEmpty()) {
                throw new BusinessException("No hay turnos en cola para el servicio de " + service.getName(), HttpStatus.NOT_FOUND);
            }

            Ticket ticket = nextTickets.get(0);
            TicketStatus oldStatus = ticket.getStatus();

            validateTransition(oldStatus, TicketStatus.LLAMADO);

            ticket.setStatus(TicketStatus.LLAMADO);
            ticket.setOperator(operator);
            ticket.setCalledAt(LocalDateTime.now());
            ticket.setPosition(null); // Sale de la cola activa

            Ticket savedTicket = ticketRepository.save(ticket);

            // Actualizar posiciones de la cola restante
            updateQueuePositions(service.getId());

            auditService.logAction(AuditAction.TICKET_STATUS_CHANGED, "Ticket", savedTicket.getId(),
                    "Estado: " + oldStatus, "Estado: " + TicketStatus.LLAMADO,
                    "Turno llamado por el operador " + operator.getUsername(), com.anthony.colasuni.enums.AuditResult.OK);

            return TicketMapper.toResponse(savedTicket);
        } catch (Exception ex) {
            auditService.logAction(AuditAction.TICKET_STATUS_CHANGED, "Ticket", 0L, null, null,
                    "Fallo al llamar siguiente turno: " + ex.getMessage(), operator, com.anthony.colasuni.enums.AuditResult.ERROR);
            throw ex;
        }
    }

    @Override
    @Transactional
    public TicketResponse startAttention(Long ticketId) {
        User operator = getCurrentUser();
        try {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado"));

            if (!operator.getId().equals(ticket.getOperator().getId())) {
                throw new BusinessException("Este turno no está asignado a tu usuario operador", HttpStatus.FORBIDDEN);
            }

            TicketStatus oldStatus = ticket.getStatus();
            validateTransition(oldStatus, TicketStatus.EN_ATENCION);

            ticket.setStatus(TicketStatus.EN_ATENCION);
            ticket.setAttendedAt(LocalDateTime.now());

            Ticket savedTicket = ticketRepository.save(ticket);

            auditService.logAction(AuditAction.TICKET_STATUS_CHANGED, "Ticket", savedTicket.getId(),
                    "Estado: " + oldStatus, "Estado: " + TicketStatus.EN_ATENCION,
                    "Inició la atención del turno", com.anthony.colasuni.enums.AuditResult.OK);

            return TicketMapper.toResponse(savedTicket);
        } catch (Exception ex) {
            auditService.logAction(AuditAction.TICKET_STATUS_CHANGED, "Ticket", ticketId, null, null,
                    "Fallo al iniciar atención de turno ID " + ticketId + ": " + ex.getMessage(), operator, com.anthony.colasuni.enums.AuditResult.ERROR);
            throw ex;
        }
    }

    @Override
    @Transactional
    public TicketResponse finishTicket(Long ticketId, FinishTicketRequest request) {
        User operator = getCurrentUser();
        try {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado"));

            if (ticket.getOperator() == null || !operator.getId().equals(ticket.getOperator().getId())) {
                throw new BusinessException("Este turno no está asignado a tu usuario operador", HttpStatus.FORBIDDEN);
            }

            TicketStatus oldStatus = ticket.getStatus();
            validateTransition(oldStatus, TicketStatus.FINALIZADO);

            ticket.setStatus(TicketStatus.FINALIZADO);
            ticket.setFinishedAt(LocalDateTime.now());
            if (request != null && request.getObservation() != null) {
                ticket.setAttentionObservation(request.getObservation());
            }

            Ticket savedTicket = ticketRepository.save(ticket);

            auditService.logAction(AuditAction.TICKET_STATUS_CHANGED, "Ticket", savedTicket.getId(),
                    "Estado: " + oldStatus, "Estado: " + TicketStatus.FINALIZADO,
                    "Turno finalizado con éxito", com.anthony.colasuni.enums.AuditResult.OK);

            return TicketMapper.toResponse(savedTicket);
        } catch (Exception ex) {
            auditService.logAction(AuditAction.TICKET_STATUS_CHANGED, "Ticket", ticketId, null, null,
                    "Fallo al finalizar turno ID " + ticketId + ": " + ex.getMessage(), operator, com.anthony.colasuni.enums.AuditResult.ERROR);
            throw ex;
        }
    }

    @Override
    @Transactional
    public TicketResponse cancelTicket(Long ticketId, CancellationRequest request) {
        User currentUser = getCurrentUser();
        try {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado"));

            // Autorización para anulación: estudiante dueño del turno, operador del servicio o administrador
            boolean isOwner = ticket.getStudent().getId().equals(currentUser.getId());
            boolean isServiceOperator = ticket.getOperator() != null && ticket.getOperator().getId().equals(currentUser.getId());
            boolean isAdmin = currentUser.getRole() == RoleEnum.ADMIN;

            if (!isOwner && !isServiceOperator && !isAdmin) {
                throw new BusinessException("No tienes permiso para anular este turno", HttpStatus.FORBIDDEN);
            }

            TicketStatus oldStatus = ticket.getStatus();
            validateTransition(oldStatus, TicketStatus.ANULADO);

            ticket.setStatus(TicketStatus.ANULADO);
            ticket.setCancellationObservation(request.getObservation());
            ticket.setPosition(null);
            ticket.setFinishedAt(LocalDateTime.now());

            Ticket savedTicket = ticketRepository.save(ticket);

            // Si estaba en cola, reordenar posiciones
            if (oldStatus == TicketStatus.EN_COLA) {
                updateQueuePositions(ticket.getService().getId());
            }

            auditService.logAction(AuditAction.TICKET_CANCELLED, "Ticket", savedTicket.getId(),
                    "Estado: " + oldStatus, "Estado: " + TicketStatus.ANULADO,
                    "Turno anulado. Motivo: " + request.getObservation(), com.anthony.colasuni.enums.AuditResult.OK);

            return TicketMapper.toResponse(savedTicket);
        } catch (Exception ex) {
            auditService.logAction(AuditAction.TICKET_CANCELLED, "Ticket", ticketId, null, null,
                    "Fallo al anular turno ID " + ticketId + ": " + ex.getMessage(), currentUser, com.anthony.colasuni.enums.AuditResult.ERROR);
            throw ex;
        }
    }

    @Override
    @Transactional
    public TicketResponse deriveTicket(Long ticketId, DerivationRequest request) {
        User operator = getCurrentUser();
        try {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado"));

            if (ticket.getOperator() == null || !operator.getId().equals(ticket.getOperator().getId())) {
                throw new BusinessException("Este turno no está asignado a tu usuario operador", HttpStatus.FORBIDDEN);
            }

            ServiceEntity targetService = serviceRepository.findById(request.getTargetServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Servicio de destino no encontrado"));

            if (!targetService.isActive()) {
                throw new BusinessException("El servicio de destino no está activo", HttpStatus.BAD_REQUEST);
            }

            TicketStatus oldStatus = ticket.getStatus();
            validateTransition(oldStatus, TicketStatus.DERIVADO);

            // 1. Finalizar turno original como DERIVADO
            ticket.setStatus(TicketStatus.DERIVADO);
            ticket.setDerivedToService(targetService);
            ticket.setDerivationReason(request.getReason());
            ticket.setFinishedAt(LocalDateTime.now());
            ticket.setPosition(null);
            Ticket savedOriginal = ticketRepository.save(ticket);

            auditService.logAction(AuditAction.TICKET_DERIVED, "Ticket", savedOriginal.getId(),
                    "Estado: " + oldStatus, "Estado: " + TicketStatus.DERIVADO,
                    "Turno derivado a: " + targetService.getName() + ". Motivo: " + request.getReason(), com.anthony.colasuni.enums.AuditResult.OK);

            // 2. Crear nuevo turno en el servicio de destino (conservando tipo NORMAL/PREFERENCIAL)
            targetService.setTicketSequence(targetService.getTicketSequence() + 1);
            serviceRepository.save(targetService);

            String newTicketCode = targetService.getPrefix() + "-" + targetService.getTicketSequence();
            long queueCount = ticketRepository.countQueueByService(targetService.getId());

            Ticket derivedTicket = Ticket.builder()
                    .ticketCode(newTicketCode)
                    .status(TicketStatus.EN_COLA)
                    .type(ticket.getType()) // Mantiene el tipo
                    .position((int) queueCount + 1)
                    .student(ticket.getStudent())
                    .service(targetService)
                    .build();

            Ticket savedDerived = ticketRepository.save(derivedTicket);

            auditService.logAction(AuditAction.TICKET_CREATED, "Ticket", savedDerived.getId(), null, savedDerived,
                    "Turno creado por derivación de turno " + ticket.getTicketCode() + ". Código nuevo: " + newTicketCode, com.anthony.colasuni.enums.AuditResult.OK);

            return TicketMapper.toResponse(savedOriginal);
        } catch (Exception ex) {
            auditService.logAction(AuditAction.TICKET_DERIVED, "Ticket", ticketId, null, null,
                    "Fallo al derivar turno ID " + ticketId + ": " + ex.getMessage(), operator, com.anthony.colasuni.enums.AuditResult.ERROR);
            throw ex;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public QueueStatusResponse getQueueStatus(Long serviceId) {
        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado"));

        // Buscar turno actual siendo llamado o en atención
        List<Ticket> activeTickets = ticketRepository.findQueueByService(serviceId); // EN_COLA ordenados
        long queueSize = activeTickets.size();

        // Buscar el ticket actualmente llamado o en atención para este servicio
        Ticket currentTicket = null;
        // Un operador tiene el turno activo, busquemos el ticket con status LLAMADO o EN_ATENCION para el servicio
        List<Ticket> calledOrAttending = ticketRepository.findAll().stream()
                .filter(t -> t.getService().getId().equals(serviceId) && 
                        (t.getStatus() == TicketStatus.LLAMADO || t.getStatus() == TicketStatus.EN_ATENCION))
                .toList();
        if (!calledOrAttending.isEmpty()) {
            currentTicket = calledOrAttending.get(0);
        }

        int estimatedWaitMinutes = (int) queueSize * 5; // 5 minutos promedio por turno

        return QueueStatusResponse.builder()
                .serviceId(service.getId())
                .serviceName(service.getName())
                .servicePrefix(service.getPrefix())
                .currentTicket(currentTicket != null ? TicketMapper.toResponse(currentTicket) : null)
                .queueSize(queueSize)
                .estimatedWaitMinutes(estimatedWaitMinutes)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> getHistory(Pageable pageable) {
        return ticketRepository.findAll(pageable).map(TicketMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> getQueueList(Long serviceId) {
        if (!serviceRepository.existsById(serviceId)) {
            throw new ResourceNotFoundException("Servicio no encontrado");
        }
        return ticketRepository.findQueueByService(serviceId).stream()
                .map(TicketMapper::toResponse)
                .toList();
    }


    @Override
    @Transactional(readOnly = true)
    public TicketResponse getActiveTicketForCurrentOperator() {
        User operator = getCurrentUser();
        return ticketRepository.findActiveTicketByOperator(operator.getId())
                .map(TicketMapper::toResponse)
                .orElse(null);
    }

    private void validateTransition(TicketStatus current, TicketStatus target) {
        boolean valid = false;
        switch (current) {
            case CREADO -> valid = (target == TicketStatus.EN_COLA);
            case EN_COLA -> valid = (target == TicketStatus.LLAMADO || target == TicketStatus.ANULADO);
            case LLAMADO -> valid = (target == TicketStatus.EN_ATENCION || target == TicketStatus.EN_COLA || target == TicketStatus.ANULADO);
            case EN_ATENCION -> valid = (target == TicketStatus.FINALIZADO || target == TicketStatus.DERIVADO || target == TicketStatus.ANULADO);
            case FINALIZADO, ANULADO, DERIVADO -> valid = false;
        }
        if (!valid) {
            throw new InvalidStateTransitionException("No se permite cambiar el estado de un turno desde " + current + " hacia " + target);
        }
    }

    private void updateQueuePositions(Long serviceId) {
        List<Ticket> activeQueue = ticketRepository.findQueueByService(serviceId);
        int idx = 1;
        for (Ticket t : activeQueue) {
            t.setPosition(idx++);
            ticketRepository.save(t);
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BusinessException("Usuario no autenticado", HttpStatus.UNAUTHORIZED);
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario actual no encontrado en el sistema"));
    }
}
