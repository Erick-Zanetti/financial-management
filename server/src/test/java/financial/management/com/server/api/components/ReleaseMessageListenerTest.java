package financial.management.com.server.api.components;

import financial.management.com.server.api.services.FinancialReleaseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.IOException;

import static org.mockito.Mockito.*;

public class ReleaseMessageListenerTest {

    @Mock
    FinancialReleaseService financialReleaseService;

    @InjectMocks
    ReleaseMessageListener releaseMessageListener;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testReceiveMessageExportsReleases() throws IOException {
        String message = "test message";
        doNothing().when(financialReleaseService).exportAndSendToEmail(anyString());
        releaseMessageListener.receiveMessageExportsReleases(message);
        verify(financialReleaseService, times(1)).exportAndSendToEmail(message);
    }
}