package financial.management.com.server.services;

import financial.management.com.server.models.FinancialRelease;
import financial.management.com.server.enums.FinancialReleaseType;
import financial.management.com.server.repositories.FinancialReleaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Objects;

@Service
public class FinancialReleaseService {

    @Autowired
    private FinancialReleaseRepository financialReleaseRepository;

    public List<FinancialRelease> findByTypeAndName(FinancialReleaseType type, Integer month, Integer year) {
        List<FinancialRelease> releases = financialReleaseRepository.findByType(type);
        releases.removeIf(release -> !Objects.equals(release.getMonth().getMonth(), month) || !Objects.equals(release.getMonth().getYear(), year));
        return releases;
    }

    public List<FinancialRelease> findAll() {
        return financialReleaseRepository.findAll();
    }

    public FinancialRelease save(FinancialRelease financialRelease) {
        return financialReleaseRepository.save(financialRelease);
    }

    public void delete(String id) {
        financialReleaseRepository.deleteById(id);
    }

    public FinancialRelease findById(String id) {
        return financialReleaseRepository.findById(id).orElse(null);
    }
}
