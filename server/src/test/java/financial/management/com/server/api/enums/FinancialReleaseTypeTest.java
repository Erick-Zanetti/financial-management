package financial.management.com.server.api.enums;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class FinancialReleaseTypeTest {

    @Test
    void getTypeShouldReturnCorrectTypeForR() {
        FinancialReleaseType type = FinancialReleaseType.R;
        assertEquals("R", type.getType());
    }

    @Test
    void getTypeShouldReturnCorrectTypeForE() {
        FinancialReleaseType type = FinancialReleaseType.E;
        assertEquals("E", type.getType());
    }

    @Test
    void valueOfShouldReturnCorrectEnumForR() {
        FinancialReleaseType type = FinancialReleaseType.valueOf("R");
        assertEquals(FinancialReleaseType.R, type);
    }

    @Test
    void valueOfShouldReturnCorrectEnumForE() {
        FinancialReleaseType type = FinancialReleaseType.valueOf("E");
        assertEquals(FinancialReleaseType.E, type);
    }
}
