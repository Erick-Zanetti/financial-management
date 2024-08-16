package financial.management.com.server.api.components;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.text.SimpleDateFormat;
import java.util.Date;

@Component
public class BackupMongoDb {

    @Value("${spring.data.mongodb.database}")
    private String database;

    @Value("${spring.data.mongodb.host}")
    private String host;

    @Value("${spring.data.mongodb.port}")
    private String port;

    @Value("${backup.path}")
    private String backupPath;

    @PostConstruct
    public void iniciarBackupImediato() {
        realizarBackup();
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void realizarBackupAgendado() {
        realizarBackup();
    }

    public void realizarBackup() {
        try {
            String dataFormatada = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss").format(new Date());
            String path = backupPath + dataFormatada;
            String command = String.format("mongodump --host %s --port %s --out=%s", host, port, path);

            System.out.println("Comando: " + command);
            Process process = Runtime.getRuntime().exec(command);
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                System.out.println("Backup realizado com sucesso.");
            } else {
                System.err.println("Falha ao realizar backup.");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
