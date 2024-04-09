package financial.management.com.server.repositories;

import financial.management.com.server.models.FinancialRelease;
import financial.management.com.server.enums.FinancialReleaseType;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FinancialReleaseRepository extends MongoRepository<FinancialRelease, String> {
    List<FinancialRelease> findByType(FinancialReleaseType type);
    List<FinancialRelease> findByTypeAndMonthAndYear(FinancialReleaseType type, Integer month, Integer year);
}
