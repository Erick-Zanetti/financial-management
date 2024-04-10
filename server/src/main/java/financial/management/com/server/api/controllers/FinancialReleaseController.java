package financial.management.com.server.api.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import financial.management.com.server.api.enums.FinancialReleaseType;
import financial.management.com.server.api.models.FinancialRelease;
import financial.management.com.server.api.services.FinancialReleaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/financial-release")
@Tag(name = "Financial Release", description = "Financial Release API")
public class FinancialReleaseController {

    @Autowired
    private FinancialReleaseService financialReleaseService;

    @GetMapping("by-type")
    @Operation(summary = "Find financial release by type", description = "Returns a list of financial release by type")
    @ApiResponse(responseCode = "200", description = "Financial release found")
    public List<FinancialRelease> findByTypeAndName(@RequestParam FinancialReleaseType type, @RequestParam Integer month, @RequestParam Integer year) {
        return financialReleaseService.findByTypeAndName(type, month, year);
    }

    @GetMapping
    @Operation(summary = "Find all financial release", description = "Returns all financial release")
    @ApiResponse(responseCode = "200", description = "Financial release found")
    public List<FinancialRelease> findAll() {
        return financialReleaseService.findAll();
    }

    @PostMapping
    @Operation(summary = "Create financial release", description = "Create a new financial release")
    @ApiResponse(responseCode = "200", description = "Financial release created")
    public FinancialRelease save(@RequestBody FinancialRelease financialRelease) {
        return financialReleaseService.save(financialRelease);
    }

    @DeleteMapping("{id}")
    @Operation(summary = "Delete financial release", description = "Delete a financial release")
    @ApiResponse(responseCode = "200", description = "Financial release deleted")
    public void delete(@PathVariable String id) {
        financialReleaseService.delete(id);
    }

    @GetMapping("{id}")
    @Operation(summary = "Find financial release by ID", description = "Returns a single financial release")
    @ApiResponse(responseCode = "200", description = "Financial release found")
    public FinancialRelease findById(@PathVariable String id) {
        return financialReleaseService.findById(id);
    }

    @PatchMapping("{id}")
    @Operation(summary = "Update financial release", description = "Update a financial release")
    @ApiResponse(responseCode = "200", description = "Financial release updated")
    public FinancialRelease update(@PathVariable String id, @RequestBody FinancialRelease financialRelease) {
        financialRelease.setId(id);
        return financialReleaseService.save(financialRelease);
    }

    @PostMapping("export")
    @Operation(summary = "Export financial release", description = "Increase queue for send email with financial release")
    @ApiResponse(responseCode = "200", description = "Financial release exported")
    public void export(@RequestParam Integer month, @RequestParam Integer year) {
        financialReleaseService.export(month, year);
    }

    @PostMapping("create-by-installments/{installments}")
    @Operation(summary = "Create financial release by installments", description = "Create a new financial release by installments")
    @ApiResponse(responseCode = "200", description = "Financial release created")
    public void createByParcels(@RequestBody FinancialRelease financialRelease, @PathVariable Integer installments) throws JsonProcessingException {
        financialReleaseService.createByParcels(financialRelease, installments);
    }

}
