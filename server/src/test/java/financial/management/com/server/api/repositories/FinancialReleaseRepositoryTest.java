package financial.management.com.server.api.repositories;

import financial.management.com.server.api.enums.FinancialReleaseType;
import financial.management.com.server.api.models.FinancialRelease;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataMongoTest
public class FinancialReleaseRepositoryTest {

    @Autowired
    private FinancialReleaseRepository financialReleaseRepository;

    @BeforeEach
    void setUp() {
        financialReleaseRepository.deleteAll();

        FinancialRelease fr1 = new FinancialRelease("1", "Test 1", 100.0f, FinancialReleaseType.R, 2021, 5, 15);
        FinancialRelease fr2 = new FinancialRelease("2", "Test 2", 200.0f, FinancialReleaseType.E, 2021, 5, 20);
        financialReleaseRepository.save(fr1);
        financialReleaseRepository.save(fr2);
    }

    @Test
    void findByTypeAndMonthAndYearShouldReturnCorrectResults() {
        List<FinancialRelease> results = financialReleaseRepository.findByTypeAndMonthAndYear(FinancialReleaseType.R, 5, 2021);
        assertEquals(1, results.size());
        assertEquals("Test 1", results.get(0).getName());
    }

    @Test
    void findByMonthAndYearShouldReturnCorrectResults() {
        List<FinancialRelease> results = financialReleaseRepository.findByMonthAndYear(5, 2021);
        assertEquals(2, results.size());
    }
}
