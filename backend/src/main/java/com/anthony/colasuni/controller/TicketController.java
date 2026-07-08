package com.anthony.colasuni.controller;

import com.anthony.colasuni.dto.ticket.*;
import com.anthony.colasuni.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        return new ResponseEntity<>(ticketService.createTicket(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ResponseEntity<List<TicketResponse>> getMyTickets() {
        return ResponseEntity.ok(ticketService.getMyTickets());
    }

    @PostMapping("/call-next")
    @PreAuthorize("hasRole('OPERADOR')")
    public ResponseEntity<TicketResponse> callNextTicket() {
        return ResponseEntity.ok(ticketService.callNextTicket());
    }

    @PatchMapping("/{id}/start")
    @PreAuthorize("hasRole('OPERADOR')")
    public ResponseEntity<TicketResponse> startAttention(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.startAttention(id));
    }

    @PatchMapping("/{id}/finish")
    @PreAuthorize("hasRole('OPERADOR')")
    public ResponseEntity<TicketResponse> finishTicket(
            @PathVariable Long id,
            @RequestBody(required = false) FinishTicketRequest request
    ) {
        return ResponseEntity.ok(ticketService.finishTicket(id, request));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<TicketResponse> cancelTicket(
            @PathVariable Long id,
            @Valid @RequestBody CancellationRequest request
    ) {
        return ResponseEntity.ok(ticketService.cancelTicket(id, request));
    }

    @PatchMapping("/{id}/derive")
    @PreAuthorize("hasRole('OPERADOR')")
    public ResponseEntity<TicketResponse> deriveTicket(
            @PathVariable Long id,
            @Valid @RequestBody DerivationRequest request
    ) {
        return ResponseEntity.ok(ticketService.deriveTicket(id, request));
    }

    @GetMapping("/queue/{serviceId}")
    public ResponseEntity<QueueStatusResponse> getQueueStatus(@PathVariable Long serviceId) {
        return ResponseEntity.ok(ticketService.getQueueStatus(serviceId));
    }

    @GetMapping("/queue/{serviceId}/list")
    @PreAuthorize("hasAnyRole('OPERADOR', 'ADMIN')")
    public ResponseEntity<List<TicketResponse>> getQueueList(@PathVariable Long serviceId) {
        return ResponseEntity.ok(ticketService.getQueueList(serviceId));
    }

    @GetMapping("/current")
    @PreAuthorize("hasRole('OPERADOR')")
    public ResponseEntity<TicketResponse> getCurrentActiveTicket() {
        TicketResponse ticketResponse = ticketService.getActiveTicketForCurrentOperator();
        if (ticketResponse == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(ticketResponse);
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<TicketResponse>> getHistory(Pageable pageable) {
        return ResponseEntity.ok(ticketService.getHistory(pageable));
    }

}
