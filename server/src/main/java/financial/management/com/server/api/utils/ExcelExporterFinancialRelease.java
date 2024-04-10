package financial.management.com.server.api.utils;

import financial.management.com.server.api.models.FinancialRelease;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public class ExcelExporterFinancialRelease {

    public Path exportListToExcel(List<FinancialRelease> release, String fileName) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("financialrelease");

        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("ID");
        headerRow.createCell(1).setCellValue("Name");
        headerRow.createCell(2).setCellValue("Value");
        headerRow.createCell(3).setCellValue("Type");
        headerRow.createCell(4).setCellValue("Year");
        headerRow.createCell(5).setCellValue("Month");
        headerRow.createCell(6).setCellValue("Day");

        int rowNum = 1;
        for (FinancialRelease person : release) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(person.getId());
            row.createCell(1).setCellValue(person.getName());
            row.createCell(2).setCellValue(person.getValue());
            row.createCell(3).setCellValue(person.getType().name());
            row.createCell(4).setCellValue(person.getYear());
            row.createCell(5).setCellValue(person.getMonth());
            row.createCell(6).setCellValue(person.getDay());
        }

        for (int i = 0; i < 2; i++) {
            sheet.autoSizeColumn(i);
        }

        Path tempFile = Files.createTempFile(fileName, ".xlsx");

        FileOutputStream fileOut = new FileOutputStream(tempFile.toFile());
        workbook.write(fileOut);
        fileOut.close();

        workbook.close();

        return tempFile;
    }

}
