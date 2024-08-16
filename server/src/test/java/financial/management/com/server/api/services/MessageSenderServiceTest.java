package financial.management.com.server.api.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import static org.mockito.Mockito.verify;

class MessageSenderServiceTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    private MessageSenderService messageSenderService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        messageSenderService = new MessageSenderService(rabbitTemplate);
    }

    @Test
    void sendReleaseMessageShouldCallRabbitTemplate() {
        String message = "testMessage";
        String exchange = "testExchange";
        String routingKey = "testRoutingKey";

        messageSenderService.sendReleaseMessage(message, exchange, routingKey);

        verify(rabbitTemplate).convertAndSend(exchange, routingKey, message);
    }
}
