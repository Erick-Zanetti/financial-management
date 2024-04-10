package financial.management.com.server.api.components;

import com.fasterxml.jackson.databind.ObjectMapper;
import financial.management.com.server.api.models.FinancialRelease;
import financial.management.com.server.api.services.FinancialReleaseService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class ReleaseMessageListener {

    @Autowired
    FinancialReleaseService financialReleaseService;

    @RabbitListener(queues = "exports-releases")
    public void receiveMessageExportsReleases(String message) throws IOException {
        System.out.println("Received <" + message + ">");
        financialReleaseService.exportAndSendToEmail(message);
    }

    @RabbitListener(queues = "parcels-releases")
    public void receiveMessageParcelsReleases(String message) throws IOException {
        System.out.println("Received <" + message + ">");
        ObjectMapper mapper = new ObjectMapper();
        FinancialRelease release = mapper.readValue(message, FinancialRelease.class);
        financialReleaseService.save(release);
    }
}

