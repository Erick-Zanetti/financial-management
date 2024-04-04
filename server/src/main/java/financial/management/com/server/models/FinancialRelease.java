package financial.management.com.server.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import financial.management.com.server.enums.FinancialReleaseType;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "financialreleases")
public class FinancialRelease {

    @Id
    private String id;
    private String name;
    private Float value;
    private FinancialReleaseType type;
    private FinancialReleaseMonth month;
}
