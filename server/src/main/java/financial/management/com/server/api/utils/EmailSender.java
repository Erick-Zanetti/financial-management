package financial.management.com.server.api.utils;

import javax.activation.DataHandler;
import javax.activation.DataSource;
import javax.activation.FileDataSource;
import javax.mail.*;
import javax.mail.internet.*;
import java.nio.file.Path;
import java.util.Properties;

public class EmailSender {

    public void sendEmailWithAttachment(String to, String from, String host, Path path) {
        Properties properties = System.getProperties();
        properties.setProperty("mail.smtp.host", host);
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.port", 587);
        properties.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getDefaultInstance(properties, new javax.mail.Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication("erick.dev.98@gmail.com", "thlo yjhc ncxc spba ");
            }
        });

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(from));
            message.addRecipient(Message.RecipientType.TO, new InternetAddress(to));
            message.setSubject("Seu extrato!");

            BodyPart messageBodyPart = new MimeBodyPart();
            messageBodyPart.setText("Segue em anexo lançamento financeiros.");

            Multipart multipart = new MimeMultipart();
            multipart.addBodyPart(messageBodyPart);
            messageBodyPart = new MimeBodyPart();
            DataSource source = new FileDataSource(path.toFile());
            messageBodyPart.setDataHandler(new DataHandler(source));
            messageBodyPart.setFileName(path.getFileName().toString());
            multipart.addBodyPart(messageBodyPart);

            message.setContent(multipart);
            Transport.send(message);
            System.out.println("E-mail enviado com sucesso!");
        } catch (MessagingException mex) {
            mex.printStackTrace();
        }
    }
}

