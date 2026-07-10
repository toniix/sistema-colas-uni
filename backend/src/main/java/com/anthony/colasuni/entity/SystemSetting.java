package com.anthony.colasuni.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    private Long id; // Siempre será 1

    @Column(name = "university_name", nullable = false, length = 150)
    private String universityName;

    @Column(name = "system_name", nullable = false, length = 100)
    private String systemName;

    @Lob
    @Column(name = "logo_base64", columnDefinition = "VARCHAR(MAX)")
    private String logoBase64;

    @Lob
    @Column(name = "cover_base64", columnDefinition = "VARCHAR(MAX)")
    private String coverBase64;

    @Column(nullable = false)
    private boolean configured;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
