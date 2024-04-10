package financial.management.com.server.api.repositories;

import financial.management.com.server.api.models.FinancialRelease;
import financial.management.com.server.api.enums.FinancialReleaseType;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FinancialReleaseRepository extends MongoRepository<FinancialRelease, String> {

    List<FinancialRelease> findByTypeAndMonthAndYear(FinancialReleaseType type, Integer month, Integer year);
    List<FinancialRelease> findByMonthAndYear(Integer month, Integer year);
}
