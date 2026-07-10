package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.report.ReportSummaryResponse;
import com.anthony.colasuni.dto.report.ReportSummaryResponse.*;
import com.anthony.colasuni.entity.Ticket;
import com.anthony.colasuni.enums.TicketStatus;
import com.anthony.colasuni.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final TicketRepository ticketRepository;

    @Override
    @Transactional(readOnly = true)
    public ReportSummaryResponse getSummary(LocalDate from, LocalDate to) {
        LocalDateTime startDateTime = from.atStartOfDay();
        LocalDateTime endDateTime = to.atTime(LocalTime.MAX);

        List<Ticket> tickets = ticketRepository.findTicketsInDateRange(startDateTime, endDateTime);

        // 1. Calcular resumen general
        long totalTickets = tickets.size();
        long atendidosCount = tickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.FINISHED)
                .count();
        long anuladosCount = tickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.CANCELLED)
                .count();
        long enColaCount = tickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.IN_QUEUE)
                .count();

        long totalEsperaMin = tickets.stream()
                .filter(t -> t.getCalledAt() != null)
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getCalledAt()).toMinutes())
                .sum();
        long ticketsConEspera = tickets.stream()
                .filter(t -> t.getCalledAt() != null)
                .count();
        long esperaPromedioMin = ticketsConEspera > 0 ? totalEsperaMin / ticketsConEspera : 0;

        SummaryMetric resumen = new SummaryMetric(
                totalTickets,
                atendidosCount,
                anuladosCount,
                enColaCount,
                esperaPromedioMin
        );

        // 2. Espera promedio por servicio
        Map<String, List<Ticket>> ticketsByService = tickets.stream()
                .collect(Collectors.groupingBy(t -> t.getService().getName()));

        List<ServiceWaitMetric> esperaPorServicio = ticketsByService.entrySet().stream()
                .map(entry -> {
                    String serviceName = entry.getKey();
                    List<Ticket> serviceTickets = entry.getValue();

                    long serviceTotalWait = serviceTickets.stream()
                            .filter(t -> t.getCalledAt() != null)
                            .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getCalledAt()).toMinutes())
                            .sum();
                    long serviceWaitCount = serviceTickets.stream()
                            .filter(t -> t.getCalledAt() != null)
                            .count();
                    long avgServiceWait = serviceWaitCount > 0 ? serviceTotalWait / serviceWaitCount : 0;

                    long serviceAttended = serviceTickets.stream()
                            .filter(t -> t.getStatus() == TicketStatus.FINISHED)
                            .count();

                    return new ServiceWaitMetric(serviceName, avgServiceWait, serviceAttended);
                })
                .toList();

        // 3. Atendidos por operador
        Map<String, Long> attendedByOperator = tickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.FINISHED && t.getOperator() != null)
                .collect(Collectors.groupingBy(
                        t -> t.getOperator().getFullName(),
                        Collectors.counting()
                ));

        List<OperatorAttendanceMetric> atendidosPorOperador = attendedByOperator.entrySet().stream()
                .map(entry -> new OperatorAttendanceMetric(entry.getKey(), entry.getValue()))
                .toList();

        // 4. Horas pico (tickets por hora)
        Map<String, Long> ticketsByHour = tickets.stream()
                .collect(Collectors.groupingBy(
                        t -> String.format("%02d:00", t.getCreatedAt().getHour()),
                        Collectors.counting()
                ));

        List<HourlyMetric> ticketsPorHora = ticketsByHour.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new HourlyMetric(entry.getKey(), entry.getValue()))
                .toList();

        return ReportSummaryResponse.builder()
                .resumen(resumen)
                .esperaPorServicio(esperaPorServicio)
                .atendidosPorOperador(atendidosPorOperador)
                .ticketsPorHora(ticketsPorHora)
                .build();
    }
}
