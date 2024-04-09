# Fase de compilação
FROM jelastic/maven:3.9.6-openjdk-22.ea-b28 as build

# Copiar os arquivos de fonte para o container
WORKDIR /app
COPY src ./src
COPY pom.xml .

# Construir a aplicação e o pacote JAR
RUN mvn clean package -DskipTests

# Fase de execução
FROM openjdk:22-jdk-slim

# Definir o diretório de trabalho
WORKDIR /app

# Copiar o JAR da fase de compilação para a fase de execução
COPY --from=build /app/target/*.jar app.jar

# Expor a porta que a aplicação utiliza
EXPOSE 8080

# Comando para iniciar a aplicação
CMD ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]