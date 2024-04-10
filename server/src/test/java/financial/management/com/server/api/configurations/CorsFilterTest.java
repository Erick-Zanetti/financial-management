package financial.management.com.server.api.configurations;

import org.junit.jupiter.api.Test;

import javax.servlet.FilterChain;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CorsFilterTest {

    @Test
    void doFilterShouldSetCorsHeaders() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        CorsFilter corsFilter = new CorsFilter();
        corsFilter.doFilter(request, response, chain);

        verify(response).setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
        verify(response).setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
        verify(response).setHeader("Access-Control-Max-Age", "3600");
        verify(response).setHeader("Access-Control-Allow-Headers", "x-requested-with, authorization");

        verify(chain).doFilter(request, response);
    }
}
