package financial.management.com.server.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FinancialReleaseMonth {
    private Integer month;
    private Integer year;
    private Integer day;
}
