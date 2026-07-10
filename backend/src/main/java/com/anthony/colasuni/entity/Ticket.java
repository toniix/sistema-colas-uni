package com.anthony.colasuni.entity;

import com.anthony.colasuni.enums.TicketPriority;
import com.anthony.colasuni.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "tickets",
    indexes = {
        @Index(name = "idx_ticket_status",      columnList = "status"),
        @Index(name = "idx_ticket_service_id",  columnList = "service_id"),
        @Index(name = "idx_ticket_operator_id", columnList = "operator_id"),
        @Index(name = "idx_ticket_student_id",  columnList = "student_id"),
        @Index(name = "idx_ticket_created_at",  columnList = "created_at"),
        @Index(name = "idx_ticket_priority",    columnList = "priority")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_code", nullable = false, unique = true, length = 20)
    private String ticketCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TicketPriority priority = TicketPriority.NORMAL;

    @Column(name = "queue_position")
    private Integer position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_ticket_student"))
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_ticket_service"))
    private ServiceEntity service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id",
                foreignKey = @ForeignKey(name = "fk_ticket_operator"))
    private User operator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "derived_to_service_id",
                foreignKey = @ForeignKey(name = "fk_ticket_derived_service"))
    private ServiceEntity derivedToService;

    @Column(name = "derivation_reason", length = 255)
    private String derivationReason;

    @Column(name = "cancellation_observation", length = 255)
    private String cancellationObservation;

    @Column(name = "attention_observation", length = 255)
    private String attentionObservation;

    @Column(name = "called_at")
    private LocalDateTime calledAt;

    @Column(name = "attended_at")
    private LocalDateTime attendedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.priority == null) {
            this.priority = TicketPriority.NORMAL;
        }
    }
}
