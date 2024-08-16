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

# Instalar o Mongo
RUN apt-get update && apt-get install -y wget && apt-get clean && rm -rf /var/lib/apt/lists/*

ARG MONGO_TOOLS_VERSION=100.9.4
ENV MONGO_TOOLS_URL=https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian10-x86_64-${MONGO_TOOLS_VERSION}.deb

RUN wget -q ${MONGO_TOOLS_URL} -O mongodb-database-tools.deb

RUN apt-get update && apt-get install -f ./mongodb-database-tools.deb -y && rm mongodb-database-tools.deb && apt-get clean && rm -rf /var/lib/apt/lists/*

# Definir o diretório de trabalho
WORKDIR /app

# Copiar o JAR da fase de compilação para a fase de execução
COPY --from=build /app/target/*.jar app.jar

# Expor a porta que a aplicação utiliza
EXPOSE 8080

# Comando para iniciar a aplicação
CMD ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]