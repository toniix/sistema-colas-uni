package com.anthony.colasuni.controller;

import com.anthony.colasuni.dto.sse.QueueUpdateEvent;
import com.anthony.colasuni.dto.ticket.QueueStatusResponse;
import com.anthony.colasuni.entity.ServiceEntity;
import com.anthony.colasuni.repository.ServiceRepository;
import com.anthony.colasuni.service.SseEmitterRegistry;
import com.anthony.colasuni.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/sse")
@RequiredArgsConstructor
@Slf4j
public class SseController {

    private final SseEmitterRegistry registry;
    private final TicketService ticketService;
    private final ServiceRepository serviceRepository;

    /**
     * Endpoint autenticado: Utilizado por Estudiante y Operador.
     * La conexión HTTP persistente se mantiene abierta.
     */
    @GetMapping(value = "/queue/{serviceId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToQueue(@PathVariable Long serviceId) {
        log.info("Intento de suscripción autenticada SSE a cola de servicio ID: {}", serviceId);
        return buildEmitterWithSnapshot(serviceId);
    }

    /**
     * Endpoint público: Utilizado por la Pantalla de Visualización (/display).
     * No requiere token JWT de autenticación.
     */
    @GetMapping(value = "/public/queue/{serviceId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToQueuePublic(@PathVariable Long serviceId) {
        log.info("Intento de suscripción pública SSE a cola de servicio ID: {}", serviceId);
        return buildEmitterWithSnapshot(serviceId);
    }

    /**
     * Endpoint público GLOBAL: Utilizado por la Pantalla de Visualización (/display) para escuchar todas las colas.
     * Reduce las conexiones en el navegador de N a 1, evitando bloqueos de red.
     */
    @GetMapping(value = "/public/queues", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToAllQueuesPublic() {
        log.info("Intento de suscripción pública SSE GLOBAL a todas las colas");
        SseEmitter emitter = registry.subscribeGlobal();
        try {
            // Obtener todos los servicios activos
            List<ServiceEntity> activeServices = serviceRepository.findAll().stream()
                    .filter(ServiceEntity::isActive)
                    .toList();
            
            // Enviar snapshot del estado inicial de cada servicio al conectar
            for (ServiceEntity service : activeServices) {
                QueueStatusResponse status = ticketService.getQueueStatus(service.getId());
                emitter.send(SseEmitter.event()
                        .name("QUEUE_UPDATE")
                        .data(new QueueUpdateEvent(service.getId(), "QUEUE_UPDATE", status)));
            }
        } catch (Exception e) {
            log.error("Error al enviar snapshot de colas en suscripción global", e);
            emitter.completeWithError(e);
        }
        return emitter;
    }

    private SseEmitter buildEmitterWithSnapshot(Long serviceId) {
        SseEmitter emitter = registry.subscribe(serviceId);
        try {
            // Empujar el estado inicial de inmediato al cliente al conectarse
            QueueStatusResponse initialState = ticketService.getQueueStatus(serviceId);
            emitter.send(SseEmitter.event()
                    .name("QUEUE_UPDATE")
                    .data(new QueueUpdateEvent(serviceId, "QUEUE_UPDATE", initialState)));
        } catch (Exception e) {
            log.error("Error al enviar snapshot inicial en suscripción SSE", e);
            emitter.completeWithError(e);
        }
        return emitter;
    }
}
