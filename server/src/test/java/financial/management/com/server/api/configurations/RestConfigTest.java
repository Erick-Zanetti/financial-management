package financial.management.com.server.api.configurations;

import org.junit.jupiter.api.Test;
import org.springframework.web.filter.CorsFilter;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class RestConfigTest {

    @Test
    void corsFilterShouldHaveCorrectConfigurations() {
        RestConfig restConfig = new RestConfig();
        CorsFilter corsFilter = restConfig.corsFilter();
        assertNotNull(corsFilter);
    }
}
