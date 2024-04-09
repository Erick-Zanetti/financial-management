package financial.management.com.server.services;

import financial.management.com.server.models.FinancialRelease;
import financial.management.com.server.enums.FinancialReleaseType;
import financial.management.com.server.repositories.FinancialReleaseRepository;
import financial.management.com.server.utils.EmailSender;
import financial.management.com.server.utils.ExcelExporterFinancialRelease;
import org.json.JSONObject;
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
            ExcelExporterFinancialRelease exporter = new ExcelExporterFinancialRelease();
            String fileName = String.format("financial-releases-%d-%d.xlsx", month, year);
            Path path = exporter.exportListToExcel(releases, fileName);
            EmailSender sender = new EmailSender();
            sender.sendEmailWithAttachment("erick.98zanetti.98@gmail.com", "erick.dev.98@gmail.com", "smtp.gmail.com", path);


        }
    }

    public void createByParcels(FinancialRelease financialRelease, Integer parcels) {
        for (int i = 1; i <= parcels; i++) {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("id", financialRelease.getValue());
            jsonObject.put("name", financialRelease.getName() + " " + i + "/" + parcels);
            jsonObject.put("value", financialRelease.getValue());
            jsonObject.put("type", financialRelease.getType());
            jsonObject.put("year", financialRelease.getYear());
            jsonObject.put("month", financialRelease.getMonth());
            jsonObject.put("day", financialRelease.getDay());
            messageSenderService.sendReleaseMessage(jsonObject.toString(), "releases", "releases-parcels-releases");

            financialRelease.setMonth(financialRelease.getMonth() + 1);
            if (financialRelease.getMonth() > 11) {
                financialRelease.setMonth(0);
                financialRelease.setYear(financialRelease.getYear() + 1);
            }
        }
    }
}
