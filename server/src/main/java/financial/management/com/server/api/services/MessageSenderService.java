package financial.management.com.server.api.services;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MessageSenderService {

    private final RabbitTemplate rabbitTemplate;

    @Autowired
    public MessageSenderService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendReleaseMessage(String message, String exchange, String routingKey) {
        rabbitTemplate.convertAndSend(exchange, routingKey, message);
    }
}

