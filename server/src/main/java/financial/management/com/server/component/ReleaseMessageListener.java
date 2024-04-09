package financial.management.com.server.component;

import financial.management.com.server.services.FinancialReleaseService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class ReleaseMessageListener {

    @Autowired
    FinancialReleaseService financialReleaseService;

    @RabbitListener(queues = "releases")
    public void receiveMessage(String message) throws IOException {
        System.out.println("Received <" + message + ">");
        financialReleaseService.exportAndSendToEmail(message);
    }
}

