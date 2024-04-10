package financial.management.com.server.api.controllers;

import financial.management.com.server.api.enums.FinancialReleaseType;
import financial.management.com.server.api.models.FinancialRelease;
import financial.management.com.server.api.services.FinancialReleaseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class FinancialReleaseControllerTest {

    @Mock
    private FinancialReleaseService financialReleaseService;

    @InjectMocks
    private FinancialReleaseController financialReleaseController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testFindByTypeAndName() {
        FinancialReleaseType type = FinancialReleaseType.E;
        int month = 5;
        int year = 2021;
        FinancialRelease financialRelease = new FinancialRelease();
        when(financialReleaseService.findByTypeAndName(type, month, year)).thenReturn(Arrays.asList(financialRelease));

        List<FinancialRelease> result = financialReleaseController.findByTypeAndName(type, month, year);
        assertEquals(1, result.size());
        verify(financialReleaseService).findByTypeAndName(type, month, year);
    }

    @Test
    public void testFindAll() {
        FinancialRelease financialRelease = new FinancialRelease();
        when(financialReleaseService.findAll()).thenReturn(Arrays.asList(financialRelease));

        List<FinancialRelease> result = financialReleaseController.findAll();
        assertEquals(1, result.size());
        verify(financialReleaseService).findAll();
    }

    @Test
    public void testSave() {
        FinancialRelease financialRelease = new FinancialRelease();
        when(financialReleaseService.save(any(FinancialRelease.class))).thenReturn(financialRelease);

        FinancialRelease result = financialReleaseController.save(new FinancialRelease());
        assertEquals(financialRelease, result);
        verify(financialReleaseService).save(any(FinancialRelease.class));
    }

    @Test
    public void testDelete() {
        doNothing().when(financialReleaseService).delete(anyString());
        financialReleaseController.delete("1");
        verify(financialReleaseService).delete("1");
    }

    @Test
    public void testFindById() {
        FinancialRelease financialRelease = new FinancialRelease();
        when(financialReleaseService.findById(anyString())).thenReturn(financialRelease);

        FinancialRelease result = financialReleaseController.findById("1");
        assertEquals(financialRelease, result);
        verify(financialReleaseService).findById("1");
    }

    @Test
    public void testUpdate() {
        FinancialRelease financialRelease = new FinancialRelease();
        when(financialReleaseService.save(any(FinancialRelease.class))).thenReturn(financialRelease);

        FinancialRelease result = financialReleaseController.update("1", new FinancialRelease());
        assertEquals(financialRelease, result);
        verify(financialReleaseService).save(any(FinancialRelease.class));
    }

}
