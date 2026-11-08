FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY . .
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace /app/backend
ENV JAR_PATH=api-gateway/target/api-gateway-1.0.0-SNAPSHOT.jar
ENTRYPOINT ["sh", "-c", "exec java -jar /app/backend/$JAR_PATH"]
