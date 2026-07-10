package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.ticket.*;
import com.anthony.colasuni.entity.ServiceEntity;
import com.anthony.colasuni.entity.Ticket;
import com.anthony.colasuni.entity.User;
import com.anthony.colasuni.enums.AuditAction;
import com.anthony.colasuni.enums.AuditResult;
import com.anthony.colasuni.enums.RoleEnum;
import com.anthony.colasuni.enums.TicketPriority;
import com.anthony.colasuni.enums.TicketStatus;
import com.anthony.colasuni.exception.BusinessException;
import com.anthony.colasuni.exception.DuplicateActiveTicketException;
import com.anthony.colasuni.exception.InvalidStateTransitionException;
import com.anthony.colasuni.exception.OperatorBusyException;
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
    private final SseEmitterRegistry sseEmitterRegistry;

    // ──────────────────────────────────────────────────────────────
    // Crear turno
    // ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request) {
        User student = getCurrentUser();
        Long serviceId = request.getServiceId();
        try {
            ServiceEntity service = serviceRepository.findById(serviceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado con ID: " + serviceId));

            if (!service.isActive()) {
                throw new BusinessException("El servicio no está activo en este momento", HttpStatus.BAD_REQUEST);
            }

            // Un estudiante solo puede tener 1 turno activo por servicio
            Optional<Ticket> activeTicket = ticketRepository.findActiveTicketByStudentAndService(student.getId(), serviceId);
            if (activeTicket.isPresent()) {
                throw new DuplicateActiveTicketException(
                        "Ya tienes un turno activo en el servicio de " + service.getName()
                        + ": " + activeTicket.get().getTicketCode());
            }

            // Incrementar secuencia del servicio
            service.setTicketSequence(service.getTicketSequence() + 1);
            serviceRepository.save(service);

            String ticketCode = service.getPrefix() + "-" + service.getTicketSequence();

            // Calcular posición actual en cola
            long queueCount = ticketRepository.countQueueByService(serviceId);
            int position = (int) queueCount + 1;

            // Si no se especificó prioridad, usar NORMAL por defecto
            TicketPriority priority = request.getPriority() != null ? request.getPriority() : TicketPriority.NORMAL;

            Ticket ticket = Ticket.builder()
                    .ticketCode(ticketCode)
                    .status(TicketStatus.IN_QUEUE)
                    .priority(priority)
                    .position(position)
                    .student(student)
                    .service(service)
                    .build();

            Ticket savedTicket = ticketRepository.save(ticket);

            auditService.logAction(AuditAction.CREATE_TICKET, "Ticket", savedTicket.getId(),
                    null, savedTicket, "Turno creado: " + ticketCode + " | Prioridad: " + priority,
                    AuditResult.OK);

            TicketResponse response = TicketMapper.toResponse(savedTicket);
            
            // Publicar evento en SSE de que hay un nuevo turno en cola
            publishQueueUpdate(serviceId, TicketStatus.IN_QUEUE);

            return response;
        } catch (Exception ex) {
            auditService.logAction(AuditAction.CREATE_TICKET, "Ticket", 0L, null, null,
                    "Fallo al crear turno para servicio ID " + serviceId + ": " + ex.getMessage(),
                    student, AuditResult.ERROR);
            throw ex;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Consultas
    // ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado con ID: " + id));
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
    @Transactional(readOnly = true)
    public TicketResponse getActiveTicketForCurrentOperator() {
        User operator = getCurrentUser();
        return ticketRepository.findActiveTicketByOperator(operator.getId()).stream()
                .findFirst()
                .map(TicketMapper::toResponse)
                .orElse(null);
    }

    // ──────────────────────────────────────────────────────────────
    // Llamar siguiente turno  (IN_QUEUE → CALLED)
    // ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TicketResponse callNextTicket() {
        User operator = getCurrentUser();
        try {
            // Buscar servicio asignado al operador
            ServiceEntity service = serviceRepository.findByAssignedOperatorId(operator.getId())
                    .orElseThrow(() -> new BusinessException(
                            "El operador no está asignado a ningún servicio", HttpStatus.BAD_REQUEST));

            // Regla 3: Un operador solo puede atender un turno a la vez
            List<Ticket> activeTickets = ticketRepository.findActiveTicketByOperator(operator.getId());
            if (!activeTickets.isEmpty()) {
                Ticket active = activeTickets.get(0);
                throw new OperatorBusyException(
                        "Ya tienes un turno activo en llamado o atención: " + active.getTicketCode()
                        + ". Finaliza o deriva ese turno antes de llamar el siguiente.");
            }

            // Buscar siguiente en cola: PREFERENTE primero, luego FIFO
            List<Ticket> nextTickets = ticketRepository.findNextInQueue(service.getId(), PageRequest.of(0, 1));
            if (nextTickets.isEmpty()) {
                throw new BusinessException(
                        "No hay turnos en cola para el servicio de " + service.getName(), HttpStatus.NOT_FOUND);
            }

            Ticket ticket = nextTickets.get(0);
            TicketStatus oldStatus = ticket.getStatus();

            validateTransition(oldStatus, TicketStatus.CALLED);

            ticket.setStatus(TicketStatus.CALLED);
            ticket.setOperator(operator);
            ticket.setCalledAt(LocalDateTime.now());
            ticket.setPosition(null); // Sale de la cola activa

            Ticket savedTicket = ticketRepository.save(ticket);

            // Reordenar posiciones de la cola restante
            updateQueuePositions(service.getId());

            auditService.logAction(AuditAction.CALL, "Ticket", savedTicket.getId(),
                    "Estado: " + oldStatus, "Estado: " + TicketStatus.CALLED,
                    "Turno llamado por el operador " + operator.getUsername(), AuditResult.OK);

            TicketResponse response = TicketMapper.toResponse(savedTicket);

            // Publicar evento en SSE de que el turno fue llamado
            publishQueueUpdate(service.getId(), TicketStatus.CALLED);

            return response;
        } catch (Exception ex) {
            auditService.logAction(AuditAction.CALL, "Ticket", 0L, null, null,
                    "Fallo al llamar siguiente turno: " + ex.getMessage(), operator, AuditResult.ERROR);
            throw ex;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Iniciar atención  (CALLED → IN_ATTENTION)
    // ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TicketResponse startAttention(Long ticketId) {
        User operator = getCurrentUser();
        try {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado con ID: " + ticketId));

            if (!operator.getId().equals(ticket.getOperator().getId())) {
                throw new BusinessException("Este turno no está asignado a tu usuario operador", HttpStatus.FORBIDDEN);
            }

            TicketStatus oldStatus = ticket.getStatus();
            validateTransition(oldStatus, TicketStatus.IN_ATTENTION);

            ticket.setStatus(TicketStatus.IN_ATTENTION);
            ticket.setAttendedAt(LocalDateTime.now());

            Ticket savedTicket = ticketRepository.save(ticket);

            auditService.logAction(AuditAction.CALL, "Ticket", savedTicket.getId(),
                    "Estado: " + oldStatus, "Estado: " + TicketStatus.IN_ATTENTION,
                    "Inició la atención del turno", AuditResult.OK);

            TicketResponse response = TicketMapper.toResponse(savedTicket);

            // Publicar evento en SSE de que inició la atención
            publishQueueUpdate(savedTicket.getService().getId(), TicketStatus.IN_ATTENTION);

            return response;
        } catch (Exception ex) {
            auditService.logAction(AuditAction.CALL, "Ticket", ticketId, null, null,
                    "Fallo al iniciar atención de turno ID " + ticketId + ": " + ex.getMessage(),
                    operator, AuditResult.ERROR);
            throw ex;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Finalizar turno  (IN_ATTENTION → FINISHED)
    // ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TicketResponse finishTicket(Long ticketId, FinishTicketRequest request) {
        User operator = getCurrentUser();
        try {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado con ID: " + ticketId));

            if (ticket.getOperator() == null || !operator.getId().equals(ticket.getOperator().getId())) {
                throw new BusinessException("Este turno no está asignado a tu usuario operador", HttpStatus.FORBIDDEN);
            }

            TicketStatus oldStatus = ticket.getStatus();
            validateTransition(oldStatus, TicketStatus.FINISHED);

            ticket.setStatus(TicketStatus.FINISHED);
            ticket.setFinishedAt(LocalDateTime.now());
            if (request != null && request.getObservation() != null) {
                ticket.setAttentionObservation(request.getObservation());
            }

            Ticket savedTicket = ticketRepository.save(ticket);

            auditService.logAction(AuditAction.FINISH, "Ticket", savedTicket.getId(),
                    "Estado: " + oldStatus, "Estado: " + TicketStatus.FINISHED,
                    "Turno finalizado con éxito", AuditResult.OK);

            TicketResponse response = TicketMapper.toResponse(savedTicket);

            // Publicar evento en SSE de que el turno finalizó
            publishQueueUpdate(savedTicket.getService().getId(), TicketStatus.FINISHED);

            return response;
        } catch (Exception ex) {
            auditService.logAction(AuditAction.FINISH, "Ticket", ticketId, null, null,
                    "Fallo al finalizar turno ID " + ticketId + ": " + ex.getMessage(),
                    operator, AuditResult.ERROR);
            throw ex;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Anular turno  (CREATED/IN_QUEUE/CALLED → CANCELLED)
    // ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TicketResponse cancelTicket(Long ticketId, CancellationRequest request) {
        User currentUser = getCurrentUser();
        try {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado con ID: " + ticketId));

            // Autorización: dueño del turno, operador del servicio o administrador
            boolean isOwner = ticket.getStudent().getId().equals(currentUser.getId());
            boolean isServiceOperator = ticket.getOperator() != null
                    && ticket.getOperator().getId().equals(currentUser.getId());
            boolean isAdmin = currentUser.getRole() == RoleEnum.ADMIN;

            if (!isOwner && !isServiceOperator && !isAdmin) {
                throw new BusinessException("No tienes permiso para anular este turno", HttpStatus.FORBIDDEN);
            }

            TicketStatus oldStatus = ticket.getStatus();
            validateTransition(oldStatus, TicketStatus.CANCELLED);

            ticket.setStatus(TicketStatus.CANCELLED);
            ticket.setCancellationObservation(request.getObservation());
            ticket.setPosition(null);
            ticket.setFinishedAt(LocalDateTime.now());

            Ticket savedTicket = ticketRepository.save(ticket);

            // Si estaba en cola, reordenar posiciones restantes
            if (oldStatus == TicketStatus.IN_QUEUE) {
                updateQueuePositions(ticket.getService().getId());
            }

            auditService.logAction(AuditAction.CANCEL, "Ticket", savedTicket.getId(),
                    "Estado: " + oldStatus, "Estado: " + TicketStatus.CANCELLED,
                    "Turno anulado. Motivo: " + request.getObservation(), AuditResult.OK);

            TicketResponse response = TicketMapper.toResponse(savedTicket);

            // Publicar evento en SSE de que el turno se canceló
            publishQueueUpdate(savedTicket.getService().getId(), TicketStatus.CANCELLED);

            return response;
        } catch (Exception ex) {
            auditService.logAction(AuditAction.CANCEL, "Ticket", ticketId, null, null,
                    "Fallo al anular turno ID " + ticketId + ": " + ex.getMessage(),
                    currentUser, AuditResult.ERROR);
            throw ex;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Derivar turno  (IN_ATTENTION → DERIVED)
    // ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TicketResponse deriveTicket(Long ticketId, DerivationRequest request) {
        User operator = getCurrentUser();
        try {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado con ID: " + ticketId));

            if (ticket.getOperator() == null || !operator.getId().equals(ticket.getOperator().getId())) {
                throw new BusinessException("Este turno no está asignado a tu usuario operador", HttpStatus.FORBIDDEN);
            }

            ServiceEntity targetService = serviceRepository.findById(request.getTargetServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Servicio de destino no encontrado"));

            if (!targetService.isActive()) {
                throw new BusinessException("El servicio de destino no está activo", HttpStatus.BAD_REQUEST);
            }

            TicketStatus oldStatus = ticket.getStatus();
            validateTransition(oldStatus, TicketStatus.DERIVED);

            // 1. Marcar turno original como DERIVED
            ticket.setStatus(TicketStatus.DERIVED);
            ticket.setDerivedToService(targetService);
            ticket.setDerivationReason(request.getReason());
            ticket.setFinishedAt(LocalDateTime.now());
            ticket.setPosition(null);
            Ticket savedOriginal = ticketRepository.save(ticket);

            auditService.logAction(AuditAction.DERIVE, "Ticket", savedOriginal.getId(),
                    "Estado: " + oldStatus, "Estado: " + TicketStatus.DERIVED,
                    "Turno derivado a: " + targetService.getName() + ". Motivo: " + request.getReason(),
                    AuditResult.OK);

            // 2. Crear nuevo turno en el servicio de destino conservando prioridad
            targetService.setTicketSequence(targetService.getTicketSequence() + 1);
            serviceRepository.save(targetService);

            String newTicketCode = targetService.getPrefix() + "-" + targetService.getTicketSequence();
            long queueCount = ticketRepository.countQueueByService(targetService.getId());

            Ticket derivedTicket = Ticket.builder()
                    .ticketCode(newTicketCode)
                    .status(TicketStatus.IN_QUEUE)
                    .priority(ticket.getPriority()) // Mantiene la prioridad original
                    .position((int) queueCount + 1)
                    .student(ticket.getStudent())
                    .service(targetService)
                    .build();

            Ticket savedDerived = ticketRepository.save(derivedTicket);

            auditService.logAction(AuditAction.CREATE_TICKET, "Ticket", savedDerived.getId(),
                    null, savedDerived,
                    "Turno creado por derivación de " + ticket.getTicketCode() + ". Nuevo código: " + newTicketCode,
                    AuditResult.OK);

            TicketResponse response = TicketMapper.toResponse(savedOriginal);

            // Publicar eventos en SSE: de donde sale (derivado/finalizado) y a donde ingresa (en cola)
            publishQueueUpdate(savedOriginal.getService().getId(), TicketStatus.DERIVED);
            publishQueueUpdate(targetService.getId(), TicketStatus.IN_QUEUE);

            return response;
        } catch (Exception ex) {
            auditService.logAction(AuditAction.DERIVE, "Ticket", ticketId, null, null,
                    "Fallo al derivar turno ID " + ticketId + ": " + ex.getMessage(),
                    operator, AuditResult.ERROR);
            throw ex;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Estado de la cola
    // ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public QueueStatusResponse getQueueStatus(Long serviceId) {
        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio no encontrado con ID: " + serviceId));

        List<Ticket> activeQueue = ticketRepository.findQueueByService(serviceId);
        long queueSize = activeQueue.size();

        // Busca el ticket actualmente llamado o en atención (query específica, sin el orElse de Optional)
        Ticket currentTicket = ticketRepository.findCurrentActiveByService(serviceId).stream()
                .findFirst()
                .orElse(null);

        int estimatedWaitMinutes = (int) queueSize * 5; // estimado: 5 min por turno

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
    public List<TicketResponse> getQueueList(Long serviceId) {
        if (!serviceRepository.existsById(serviceId)) {
            throw new ResourceNotFoundException("Servicio no encontrado con ID: " + serviceId);
        }
        return ticketRepository.findQueueByService(serviceId).stream()
                .map(TicketMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> getHistory(Pageable pageable) {
        return ticketRepository.findAll(pageable).map(TicketMapper::toResponse);
    }

    // ──────────────────────────────────────────────────────────────
    // Máquina de estados — transiciones válidas
    // ──────────────────────────────────────────────────────────────

    /**
     * Valida la transición de estado del ticket según las reglas del negocio.
     * Las únicas transiciones permitidas son:
     * <pre>
     *   IN_QUEUE    → CALLED
     *   CALLED      → IN_ATTENTION
     *   IN_ATTENTION → FINISHED
     *   IN_ATTENTION → DERIVED
     *   IN_QUEUE    → CANCELLED
     *   CALLED      → CANCELLED
     *   CREATED     → CANCELLED  (estado inicial alternativo)
     *   CREATED     → IN_QUEUE   (flujo de creación, raramente usado)
     * </pre>
     */
    private void validateTransition(TicketStatus current, TicketStatus target) {
        boolean valid = switch (current) {
            case CREATED     -> target == TicketStatus.IN_QUEUE || target == TicketStatus.CANCELLED;
            case IN_QUEUE    -> target == TicketStatus.CALLED   || target == TicketStatus.CANCELLED;
            case CALLED      -> target == TicketStatus.IN_ATTENTION || target == TicketStatus.CANCELLED;
            case IN_ATTENTION -> target == TicketStatus.FINISHED || target == TicketStatus.DERIVED;
            case FINISHED, CANCELLED, DERIVED -> false;
        };

        if (!valid) {
            throw new InvalidStateTransitionException(
                    "Transición inválida: no se puede pasar de [" + current + "] a [" + target + "]");
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers internos
    // ──────────────────────────────────────────────────────────────

    /**
     * Reordena las posiciones de la cola del servicio tras llamar o anular un turno.
     */
    private void updateQueuePositions(Long serviceId) {
        List<Ticket> activeQueue = ticketRepository.findQueueByService(serviceId);
        int idx = 1;
        for (Ticket t : activeQueue) {
            t.setPosition(idx++);
            ticketRepository.save(t);
        }
    }

    /**
     * Obtiene el usuario autenticado actualmente en el contexto de seguridad.
     */
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

    private void publishQueueUpdate(Long serviceId, TicketStatus status) {
        try {
            com.anthony.colasuni.dto.sse.QueueUpdateEvent event = new com.anthony.colasuni.dto.sse.QueueUpdateEvent(
                    serviceId,
                    status.name(),
                    getQueueStatus(serviceId)
            );
            sseEmitterRegistry.publish(serviceId, event);
        } catch (Exception e) {
            // Capturar silenciosamente cualquier error para no interrumpir el flujo transaccional principal
        }
    }
}

