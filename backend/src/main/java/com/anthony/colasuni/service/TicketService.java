package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.ticket.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TicketService {

    TicketResponse createTicket(CreateTicketRequest request);

    TicketResponse getTicketById(Long id);

    List<TicketResponse> getMyTickets();

    TicketResponse callNextTicket();

    TicketResponse startAttention(Long ticketId);

    TicketResponse finishTicket(Long ticketId, FinishTicketRequest request);

    TicketResponse cancelTicket(Long ticketId, CancellationRequest request);

    TicketResponse deriveTicket(Long ticketId, DerivationRequest request);

    TicketResponse getActiveTicketForCurrentOperator();

    QueueStatusResponse getQueueStatus(Long serviceId);

    List<TicketResponse> getQueueList(Long serviceId);



    Page<TicketResponse> getHistory(Pageable pageable);
}
