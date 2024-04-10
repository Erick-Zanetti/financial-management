package financial.management.com.server.api.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import financial.management.com.server.api.enums.FinancialReleaseType;
import financial.management.com.server.api.models.FinancialRelease;
import financial.management.com.server.api.repositories.FinancialReleaseRepository;
import financial.management.com.server.api.utils.EmailSender;
import financial.management.com.server.api.utils.ExcelExporterFinancialRelease;
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
        messageSenderService.sendReleaseMessage(year + "-" + month, "releases", "releases-exports-releases");
    }

    public void exportAndSendToEmail(String message) throws IOException {
        String[] messageParts = message.split("-");
        Integer year = Integer.parseInt(messageParts[0]);
        Integer month = Integer.parseInt(messageParts[1]);
        List<FinancialRelease> releases = financialReleaseRepository.findByMonthAndYear(month, year);
        if (Objects.nonNull(releases) && !releases.isEmpty()) {
            ExcelExporterFinancialRelease exporter = createExcelExporter();
            String fileName = String.format("financial-releases-%d-%d.xlsx", month, year);
            Path path = exporter.exportListToExcel(releases, fileName);
            EmailSender sender = createEmailSender();
            sender.sendEmailWithAttachment("erick.98zanetti.98@gmail.com", "erick.dev.98@gmail.com", "smtp.gmail.com", path);


        }
    }

    public ExcelExporterFinancialRelease createExcelExporter() {
        return new ExcelExporterFinancialRelease();
    }

    public EmailSender createEmailSender() {
        return new EmailSender();
    }

    public void createByParcels(FinancialRelease financialRelease, Integer installments) throws JsonProcessingException {
        for (int i = 1; i <= installments; i++) {
            ObjectMapper mapper = new ObjectMapper();
            mapper.writeValueAsString(financialRelease);
            messageSenderService.sendReleaseMessage(mapper.writeValueAsString(financialRelease), "releases", "releases-installments-releases");

            financialRelease.setMonth(financialRelease.getMonth() + 1);
            if (financialRelease.getMonth() > 11) {
                financialRelease.setMonth(0);
                financialRelease.setYear(financialRelease.getYear() + 1);
            }
        }
    }
}
