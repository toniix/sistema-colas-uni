-- ===========================================================
-- ELIMINAR TODAS LAS TABLAS DEL SISTEMA COLAS UNI
-- SQL SERVER
-- ===========================================================

IF OBJECT_ID('dbo.audit_logs', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.audit_logs;
END
GO

IF OBJECT_ID('dbo.refresh_tokens', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.refresh_tokens;
END
GO

IF OBJECT_ID('dbo.tickets', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.tickets;
END
GO

IF OBJECT_ID('dbo.services', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.services;
END
GO

IF OBJECT_ID('dbo.users', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.users;
END
GO

PRINT 'Todas las tablas fueron eliminadas correctamente.';