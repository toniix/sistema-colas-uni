-- =========================================================================
-- SISTEMA INTEGRAL DE COLAS, ATENCIÓN Y TRAZABILIDAD (SISTEMA COLAS UNI)
-- SCRIPT DE CREACIÓN DE BASE DE DATOS - SQL SERVER
-- =========================================================================

-- 1. Crear la tabla de Usuarios (users)
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NULL,
    
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'OPERATOR', 'STUDENT'))
);

-- Índices en la tabla users
CREATE INDEX idx_user_username ON users (username);
CREATE INDEX idx_user_email ON users (email);
CREATE INDEX idx_user_role ON users (role);


-- 2. Crear la tabla de Servicios (services)
CREATE TABLE services (
    id BIGINT IDENTITY(1,1) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    prefix VARCHAR(10) NOT NULL,
    ticket_sequence BIGINT NOT NULL DEFAULT 0,
    active BIT NOT NULL DEFAULT 1,
    assigned_operator_id BIGINT NULL,
    created_at DATETIME2 NOT NULL,
    
    CONSTRAINT pk_services PRIMARY KEY (id),
    CONSTRAINT uk_service_name UNIQUE (name),
    CONSTRAINT uk_service_prefix UNIQUE (prefix),
    CONSTRAINT fk_service_operator FOREIGN KEY (assigned_operator_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT uk_service_assigned_operator UNIQUE (assigned_operator_id)
);

-- Índices en la tabla services
CREATE INDEX idx_service_name ON services (name);
CREATE INDEX idx_service_prefix ON services (prefix);


-- 3. Crear la tabla de Turnos / Tickets (tickets)
CREATE TABLE tickets (
    id BIGINT IDENTITY(1,1) NOT NULL,
    ticket_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    queue_position INT NULL,
    student_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    operator_id BIGINT NULL,
    derived_to_service_id BIGINT NULL,
    derivation_reason VARCHAR(255) NULL,
    cancellation_observation VARCHAR(255) NULL,
    attention_observation VARCHAR(255) NULL,
    called_at DATETIME2 NULL,
    attended_at DATETIME2 NULL,
    finished_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL,
    
    CONSTRAINT pk_tickets PRIMARY KEY (id),
    CONSTRAINT uk_tickets_ticket_code UNIQUE (ticket_code),
    CONSTRAINT fk_ticket_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT fk_ticket_service FOREIGN KEY (service_id) REFERENCES services (id),
    CONSTRAINT fk_ticket_operator FOREIGN KEY (operator_id) REFERENCES users (id),
    CONSTRAINT fk_ticket_derived_service FOREIGN KEY (derived_to_service_id) REFERENCES services (id),
    
    CONSTRAINT chk_tickets_status CHECK (status IN ('CREATED', 'IN_QUEUE', 'CALLED', 'IN_ATTENTION', 'FINISHED', 'CANCELLED', 'DERIVED')),
    CONSTRAINT chk_tickets_priority CHECK (priority IN ('NORMAL', 'PREFERENTE'))
);

-- Índices en la tabla tickets
CREATE INDEX idx_ticket_status ON tickets (status);
CREATE INDEX idx_ticket_service_id ON tickets (service_id);
CREATE INDEX idx_ticket_operator_id ON tickets (operator_id);
CREATE INDEX idx_ticket_student_id ON tickets (student_id);
CREATE INDEX idx_ticket_created_at ON tickets (created_at);
CREATE INDEX idx_ticket_priority ON tickets (priority);


-- 4. Crear la tabla de Tokens de Refresco (refresh_tokens)
CREATE TABLE refresh_tokens (
    id BIGINT IDENTITY(1,1) NOT NULL,
    token VARCHAR(128) NOT NULL,
    user_id BIGINT NOT NULL,
    expiry_date DATETIME2 NOT NULL,
    revoked BIT NOT NULL DEFAULT 0,
    
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
    CONSTRAINT uk_refresh_tokens_token UNIQUE (token),
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);


-- 5. Crear la tabla de Bitácora de Auditoría (audit_logs)
CREATE TABLE audit_logs (
    id BIGINT IDENTITY(1,1) NOT NULL,
    action VARCHAR(30) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NULL,
    performed_by_id BIGINT NULL,
    old_value VARCHAR(4000) NULL,
    new_value VARCHAR(4000) NULL,
    ip_address VARCHAR(45) NULL,
    result VARCHAR(10) NOT NULL,
    description VARCHAR(1000) NULL,
    created_at DATETIME2 NOT NULL,
    
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT fk_audit_user FOREIGN KEY (performed_by_id) REFERENCES users (id) ON DELETE SET NULL,
    
    CONSTRAINT chk_audit_action CHECK (action IN (
        'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 
        'CREATE_TICKET', 'CALL', 'FINISH', 'DERIVE', 'CANCEL', 
        'UPDATE', 'DELETE',
        'TICKET_CREATED', 'TICKET_STATUS_CHANGED', 'TICKET_DERIVED', 'TICKET_CANCELLED',
        'USER_CREATED', 'USER_UPDATED', 'USER_DELETED'
    )),
    CONSTRAINT chk_audit_result CHECK (result IN ('OK', 'ERROR'))
);
