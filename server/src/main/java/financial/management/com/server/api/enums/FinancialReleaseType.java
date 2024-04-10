package financial.management.com.server.api.enums;

public enum FinancialReleaseType {
    R("R"),
    E("E");

    private String type;

    FinancialReleaseType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }
}
