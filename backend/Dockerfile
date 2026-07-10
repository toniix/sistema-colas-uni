# ==========================================
# Etapa 1: Construcción (Build)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Copiar pom.xml primero para aprovechar el caché de Docker con las dependencias
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar el código fuente y construir el jar omitiendo las pruebas unitarias
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Etapa 2: Ejecución (Runtime)
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copiar el JAR generado desde la etapa de construcción
COPY --from=build /app/target/*.jar app.jar

# Configurar el puerto de escucha
EXPOSE 8080

# Variable de entorno por defecto para el puerto (Render define PORT automáticamente)
ENV PORT=8080

# Ejecutar la aplicación pasando el puerto de forma dinámica
ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
