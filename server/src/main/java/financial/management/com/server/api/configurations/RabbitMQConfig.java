package financial.management.com.server.api.configurations;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Bean
    TopicExchange exchangRelease() {
        return new TopicExchange("releases");
    }

    @Bean
    Queue queueExports() {
        return new Queue("exports-releases", false);
    }

    @Bean
    Binding bindinExports(Queue queueExports, TopicExchange exchangRelease) {
        return BindingBuilder.bind(queueExports).to(exchangRelease).with("releases-exports-releases");
    }

    @Bean
    Queue queueParcels() {
        return new Queue("parcels-releases", false);
    }

    @Bean
    Binding bindinParcels(Queue queueParcels, TopicExchange exchangRelease) {
        return BindingBuilder.bind(queueParcels).to(exchangRelease).with("releases-parcels-releases");
    }
}

