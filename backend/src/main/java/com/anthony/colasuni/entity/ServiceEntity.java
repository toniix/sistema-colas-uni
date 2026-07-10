package com.anthony.colasuni.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "services",
    indexes = {
        @Index(name = "idx_service_name",   columnList = "name"),
        @Index(name = "idx_service_prefix", columnList = "prefix")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_service_name",   columnNames = "name"),
        @UniqueConstraint(name = "uk_service_prefix", columnNames = "prefix")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, length = 10)
    private String prefix;

    @Column(name = "ticket_sequence", nullable = false)
    @Builder.Default
    private Long ticketSequence = 0L;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_operator_id", unique = true,
                foreignKey = @ForeignKey(name = "fk_service_operator"))
    private User assignedOperator;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
