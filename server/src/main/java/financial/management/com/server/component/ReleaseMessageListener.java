package financial.management.com.server.component;

import financial.management.com.server.enums.FinancialReleaseType;
import financial.management.com.server.models.FinancialRelease;
import financial.management.com.server.services.FinancialReleaseService;
import org.json.JSONObject;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class ReleaseMessageListener {

    @Autowired
    FinancialReleaseService financialReleaseService;

    @RabbitListener(queues = "exports-releases")
    public void receiveMessageExportsReleases(String message) throws IOException {
        System.out.println("Received <" + message + ">");
        financialReleaseService.exportAndSendToEmail(message);
    }

    @RabbitListener(queues = "parcels-releases")
    public void receiveMessageParcelsReleases(String message) throws IOException {
        System.out.println("Received <" + message + ">");
        JSONObject jsonObject = new JSONObject(message);

        FinancialRelease financialRelease = new FinancialRelease();
        financialRelease.setName(jsonObject.getString("name"));
        financialRelease.setMonth(jsonObject.getInt("month"));
        financialRelease.setYear(jsonObject.getInt("year"));
        financialRelease.setValue(jsonObject.getFloat("value"));
        financialRelease.setType(FinancialReleaseType.valueOf(jsonObject.getString("type")));
        financialRelease.setDay(jsonObject.getInt("day"));

        financialReleaseService.save(financialRelease);
    }
}

