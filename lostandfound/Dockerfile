# ----------- Build Stage -----------
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy backend source code
COPY . .

# Build Spring Boot jar
RUN mvn clean package -DskipTests

# ----------- Run Stage -----------
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Run the Spring Boot app
ENTRYPOINT ["java", "-jar", "app.jar"]