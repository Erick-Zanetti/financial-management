package financial.management.com.server.api.models;

import financial.management.com.server.api.enums.FinancialReleaseType;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class FinancialReleaseTest {

    @Test
    void testFinancialReleaseGettersAndSetters() {
        FinancialRelease financialRelease = new FinancialRelease();

        financialRelease.setId("1");
        assertEquals("1", financialRelease.getId());

        financialRelease.setName("Test Name");
        assertEquals("Test Name", financialRelease.getName());

        financialRelease.setValue(1000.0f);
        assertEquals(1000.0f, financialRelease.getValue());

        financialRelease.setType(FinancialReleaseType.R);
        assertEquals(FinancialReleaseType.R, financialRelease.getType());

        financialRelease.setYear(2021);
        assertEquals(2021, financialRelease.getYear());

        financialRelease.setMonth(12);
        assertEquals(12, financialRelease.getMonth());

        financialRelease.setDay(31);
        assertEquals(31, financialRelease.getDay());
    }
}
