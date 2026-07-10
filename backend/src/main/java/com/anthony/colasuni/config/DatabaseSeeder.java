package com.anthony.colasuni.config;

import com.anthony.colasuni.entity.ServiceEntity;
import com.anthony.colasuni.entity.SystemSetting;
import com.anthony.colasuni.entity.User;
import com.anthony.colasuni.enums.AuditAction;
import com.anthony.colasuni.enums.AuditResult;
import com.anthony.colasuni.enums.RoleEnum;
import com.anthony.colasuni.repository.ServiceRepository;
import com.anthony.colasuni.repository.SystemSettingRepository;
import com.anthony.colasuni.repository.UserRepository;
import com.anthony.colasuni.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Override
    public void run(String... args) {
        if (systemSettingRepository.count() == 0) {
            SystemSetting defaultSettings = SystemSetting.builder()
                    .id(1L)
                    .universityName("Universidad Nacional")
                    .systemName("Sistema de Colas")
                    .logoBase64(null)
                    .coverBase64(null)
                    .configured(false)
                    .build();
            systemSettingRepository.save(defaultSettings);
            log.info("Configuración de branding semilla inicializada.");
        }

        if (userRepository.count() == 0) {
            log.info("Base de datos vacía. Iniciando inserción de datos semilla...");

            // 1. Crear Administrador
            User admin = User.builder()
                    .username("admin")
                    .email("admin@unica.edu.pe")
                    .fullName("Administrador Sistema Colas")
                    .password(passwordEncoder.encode("admin123"))
                    .role(RoleEnum.ADMIN)
                    .enabled(true)
                    .build();
            User savedAdmin = userRepository.save(admin);
            auditService.logAction(AuditAction.USER_CREATED, "User", savedAdmin.getId(), null, savedAdmin, "Usuario Administrador Semilla Creado", savedAdmin, AuditResult.OK);

            // 2. Crear Operador
            User operator = User.builder()
                    .username("operador")
                    .email("operador@unica.edu.pe")
                    .fullName("Juan Pérez (Operador MAT)")
                    .password(passwordEncoder.encode("operador123"))
                    .role(RoleEnum.OPERATOR)
                    .enabled(true)
                    .build();
            User savedOperator = userRepository.save(operator);
            auditService.logAction(AuditAction.USER_CREATED, "User", savedOperator.getId(), null, savedOperator, "Usuario Operador Semilla Creado", savedAdmin, AuditResult.OK);

            // 3. Crear Estudiante
            User student = User.builder()
                    .username("estudiante")
                    .email("estudiante@unica.edu.pe")
                    .fullName("Carlos Gómez (Estudiante)")
                    .password(passwordEncoder.encode("estudiante123"))
                    .role(RoleEnum.STUDENT)
                    .enabled(true)
                    .build();
            User savedStudent = userRepository.save(student);
            auditService.logAction(AuditAction.USER_CREATED, "User", savedStudent.getId(), null, savedStudent, "Usuario Estudiante Semilla Creado", savedAdmin, AuditResult.OK);


            // 4. Crear Servicio MAT (Matrícula) asignado a Operador
            ServiceEntity matService = ServiceEntity.builder()
                    .name("Matrícula")
                    .description("Trámites de matrícula, rectificación e inscripciones")
                    .prefix("MAT")
                    .ticketSequence(0L)
                    .assignedOperator(savedOperator)
                    .active(true)
                    .build();
            serviceRepository.save(matService);

            // 5. Crear Servicio TES (Tesorería) libre
            ServiceEntity tesService = ServiceEntity.builder()
                    .name("Tesorería")
                    .description("Pagos de pensiones, constancias y multas")
                    .prefix("TES")
                    .ticketSequence(0L)
                    .assignedOperator(null)
                    .active(true)
                    .build();
            serviceRepository.save(tesService);

            log.info("Semilla de base de datos completada exitosamente.");
            log.info("Credenciales semilla:");
            log.info(" - Administrador: admin / admin123");
            log.info(" - Operador: operador / operador123");
            log.info(" - Estudiante: estudiante / estudiante123");
        } else {
            log.info("La base de datos ya contiene registros. Omitiendo datos semilla.");
        }
    }
}
