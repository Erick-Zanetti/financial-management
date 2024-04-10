package financial.management.com.server.api.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import financial.management.com.server.api.enums.FinancialReleaseType;
import financial.management.com.server.api.models.FinancialRelease;
import financial.management.com.server.api.repositories.FinancialReleaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class FinancialReleaseServiceTest {

    @Mock
    private FinancialReleaseRepository financialReleaseRepository;

    @Mock
    private MessageSenderService messageSenderService;

    @InjectMocks
    private FinancialReleaseService financialReleaseService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void findByTypeAndNameShouldReturnResults() {
        FinancialRelease release = new FinancialRelease();
        when(financialReleaseRepository.findByTypeAndMonthAndYear(any(FinancialReleaseType.class), anyInt(), anyInt()))
                .thenReturn(Collections.singletonList(release));

        List<FinancialRelease> results = financialReleaseService.findByTypeAndName(FinancialReleaseType.R, 1, 2020);
        assertEquals(1, results.size());
        verify(financialReleaseRepository).findByTypeAndMonthAndYear(any(FinancialReleaseType.class), anyInt(), anyInt());
    }

    @Test
    void findAllShouldReturnAllResults() {
        FinancialRelease release = new FinancialRelease();
        when(financialReleaseRepository.findAll()).thenReturn(Collections.singletonList(release));

        List<FinancialRelease> results = financialReleaseService.findAll();
        assertEquals(1, results.size());
        verify(financialReleaseRepository).findAll();
    }

    @Test
    void saveShouldPersistFinancialRelease() {
        FinancialRelease release = new FinancialRelease();
        when(financialReleaseRepository.save(any(FinancialRelease.class))).thenReturn(release);

        FinancialRelease result = financialReleaseService.save(new FinancialRelease());
        assertEquals(release, result);
        verify(financialReleaseRepository).save(any(FinancialRelease.class));
    }

    @Test
    void deleteShouldRemoveFinancialRelease() {
        doNothing().when(financialReleaseRepository).deleteById(anyString());
        financialReleaseService.delete("1");
        verify(financialReleaseRepository).deleteById("1");
    }

    @Test
    void findByIdShouldReturnFinancialRelease() {
        FinancialRelease release = new FinancialRelease();
        when(financialReleaseRepository.findById(anyString())).thenReturn(Optional.of(release));

        FinancialRelease result = financialReleaseService.findById("1");
        assertEquals(release, result);
        verify(financialReleaseRepository).findById("1");
    }

    @Test
    void testCreateByParcels() throws JsonProcessingException {
        FinancialRelease financialRelease = new FinancialRelease();
        financialRelease.setMonth(1);
        financialRelease.setYear(2020);


        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(financialRelease);

        financialReleaseService.createByParcels(financialRelease, 2);

        verify(messageSenderService, times(1)).sendReleaseMessage(json, "releases", "releases-installments-releases");
        financialRelease.setMonth(2);
        String json2 = mapper.writeValueAsString(financialRelease);
        verify(messageSenderService, times(1)).sendReleaseMessage(json2, "releases", "releases-installments-releases");

        assertEquals(2, financialRelease.getMonth());
        assertEquals(2020, financialRelease.getYear());
    }

}
