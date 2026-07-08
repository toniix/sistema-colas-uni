package com.anthony.colasuni.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportSummaryResponse {

    private SummaryMetric resumen;
    private List<ServiceWaitMetric> esperaPorServicio;
    private List<OperatorAttendanceMetric> atendidosPorOperador;
    private List<HourlyMetric> ticketsPorHora;

    public record SummaryMetric(
            long totalTickets,
            long atendidos,
            long anulados,
            long enCola,
            long esperaPromedioMin
    ) {}

    public record ServiceWaitMetric(
            String servicio,
            long esperaPromedioMin,
            long atendidos
    ) {}

    public record OperatorAttendanceMetric(
            String operador,
            long atendidos
    ) {}

    public record HourlyMetric(
            String hora,
            long cantidad
    ) {}
}
