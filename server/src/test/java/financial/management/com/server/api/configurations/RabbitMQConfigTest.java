package financial.management.com.server.api.configurations;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

class RabbitMQConfigTest {

    @Test
    void contextLoads() {
        ApplicationContext ctx = new AnnotationConfigApplicationContext(RabbitMQConfig.class);
        assertNotNull(ctx);
    }

    @Test
    void testExchange() {
        ApplicationContext ctx = new AnnotationConfigApplicationContext(RabbitMQConfig.class);
        TopicExchange exchange = ctx.getBean("exchangRelease", TopicExchange.class);
        assertNotNull(exchange);
        assertEquals("releases", exchange.getName());
    }

    @Test
    void testQueueExports() {
        ApplicationContext ctx = new AnnotationConfigApplicationContext(RabbitMQConfig.class);
        Queue queue = ctx.getBean("queueExports", Queue.class);
        assertNotNull(queue);
        assertEquals("exports-releases", queue.getName());
        assertFalse(queue.isDurable());
    }

    @Test
    void testBindingExports() {
        ApplicationContext ctx = new AnnotationConfigApplicationContext(RabbitMQConfig.class);
        Binding binding = ctx.getBean("bindinExports", Binding.class);
        assertNotNull(binding);
        assertEquals("exports-releases", binding.getDestination());
        assertEquals("releases-exports-releases", binding.getRoutingKey());
    }

    @Test
    void testQueueParcels() {
        ApplicationContext ctx = new AnnotationConfigApplicationContext(RabbitMQConfig.class);
        Queue queue = ctx.getBean("queueParcels", Queue.class);
        assertNotNull(queue);
        assertEquals("installments-releases", queue.getName());
        assertFalse(queue.isDurable());
    }

    @Test
    void testBindingParcels() {
        ApplicationContext ctx = new AnnotationConfigApplicationContext(RabbitMQConfig.class);
        Binding binding = ctx.getBean("bindinParcels", Binding.class);
        assertNotNull(binding);
        assertEquals("installments-releases", binding.getDestination());
        assertEquals("releases-installments-releases", binding.getRoutingKey());
    }
}
