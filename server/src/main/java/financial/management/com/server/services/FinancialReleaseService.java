package financial.management.com.server.services;

import financial.management.com.server.models.FinancialRelease;
import financial.management.com.server.enums.FinancialReleaseType;
import financial.management.com.server.repositories.FinancialReleaseRepository;
import financial.management.com.server.utils.EmailSender;
import financial.management.com.server.utils.ExcelExporterFinancialRelease;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Objects;

@Service
public class FinancialReleaseService {

    @Autowired
    private FinancialReleaseRepository financialReleaseRepository;

    @Autowired
    private MessageSenderService messageSenderService;

    public List<FinancialRelease> findByTypeAndName(FinancialReleaseType type, Integer month, Integer year) {
        return financialReleaseRepository.findByTypeAndMonthAndYear(type, month, year);
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

    public void export(Integer month, Integer year) {
        messageSenderService.sendReleaseMessage(year + "-" + month, "exports", "releases-exports");
    }

    public void exportAndSendToEmail(String message) throws IOException {
        String[] messageParts = message.split("-");
        Integer year = Integer.parseInt(messageParts[0]);
        Integer month = Integer.parseInt(messageParts[1]);
        List<FinancialRelease> releases = financialReleaseRepository.findByMonthAndYear(month, year);
        if (Objects.nonNull(releases) && !releases.isEmpty()) {
            ExcelExporterFinancialRelease exporter = new ExcelExporterFinancialRelease();
            String fileName = String.format("financial-releases-%d-%d.xlsx", month, year);
            Path path = exporter.exportListToExcel(releases, fileName);
            EmailSender sender = new EmailSender();
            sender.sendEmailWithAttachment("erick.98zanetti.98@gmail.com", "erick.dev.98@gmail.com", "smtp.gmail.com", path);


        }
    }
}
