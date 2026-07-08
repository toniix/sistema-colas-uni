package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.report.ReportSummaryResponse;
import java.time.LocalDate;

public interface ReportService {
    ReportSummaryResponse getSummary(LocalDate from, LocalDate to);
}
