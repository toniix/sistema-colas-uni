package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.sse.QueueUpdateEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@Slf4j
public class SseEmitterRegistry {

    // Mapa thread-safe para agrupar emisores SSE activos por ID de servicio (Estudiante / Operador)
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    // Lista thread-safe para emisores que escuchan cambios globales (para la PantallaPage)
    private final CopyOnWriteArrayList<SseEmitter> globalEmitters = new CopyOnWriteArrayList<>();

    /**
     * Registra un cliente interesado en las actualizaciones de un servicio específico.
     */
    public SseEmitter subscribe(Long serviceId) {
        SseEmitter emitter = new SseEmitter(180_000L);
        emitters.computeIfAbsent(serviceId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(serviceId, emitter));
        emitter.onTimeout(() -> remove(serviceId, emitter));
        emitter.onError((e) -> remove(serviceId, emitter));

        log.debug("Cliente suscrito a la cola del servicio ID {}. Total suscriptores del servicio: {}", 
                serviceId, emitters.get(serviceId).size());

        return emitter;
    }

    /**
     * Registra un cliente interesado en escuchar de forma global todas las colas del sistema.
     */
    public SseEmitter subscribeGlobal() {
        SseEmitter emitter = new SseEmitter(180_000L);
        globalEmitters.add(emitter);

        emitter.onCompletion(() -> globalEmitters.remove(emitter));
        emitter.onTimeout(() -> globalEmitters.remove(emitter));
        emitter.onError((e) -> globalEmitters.remove(emitter));

        log.debug("Cliente suscrito de forma GLOBAL. Total suscriptores globales: {}", globalEmitters.size());

        return emitter;
    }

    /**
     * Envía un evento a todos los clientes suscritos al servicio específico y a los suscriptores globales.
     */
    public void publish(Long serviceId, QueueUpdateEvent event) {
        // 1. Enviar a los suscriptores del servicio específico
        List<SseEmitter> targets = emitters.get(serviceId);
        if (targets != null && !targets.isEmpty()) {
            log.debug("Publicando evento {} en servicio ID {}. Enviando a {} clientes del servicio...", 
                    event.getEventType(), serviceId, targets.size());
            targets.forEach(emitter -> {
                try {
                    emitter.send(SseEmitter.event().name(event.getEventType()).data(event));
                } catch (Exception e) {
                    remove(serviceId, emitter);
                }
            });
        }

        // 2. Enviar a los suscriptores globales
        if (!globalEmitters.isEmpty()) {
            log.debug("Difundiendo evento {} globalmente a {} pantallas...", event.getEventType(), globalEmitters.size());
            globalEmitters.forEach(emitter -> {
                try {
                    emitter.send(SseEmitter.event().name(event.getEventType()).data(event));
                } catch (Exception e) {
                    globalEmitters.remove(emitter);
                }
            });
        }
    }

    private void remove(Long serviceId, SseEmitter emitter) {
        emitters.computeIfPresent(serviceId, (key, list) -> {
            list.remove(emitter);
            log.debug("Emisor removido del servicio ID {}. Conexiones restantes: {}", key, list.size());
            return list;
        });
    }
}
