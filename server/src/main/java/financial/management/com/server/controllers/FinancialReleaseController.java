package financial.management.com.server.controllers;

import financial.management.com.server.models.FinancialRelease;
import financial.management.com.server.enums.FinancialReleaseType;
import financial.management.com.server.services.FinancialReleaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/financial-release")
public class FinancialReleaseController {

    @Autowired
    private FinancialReleaseService financialReleaseService;

    @GetMapping("by-type")
    public List<FinancialRelease> findByTypeAndName(@RequestParam FinancialReleaseType type, @RequestParam Integer month, @RequestParam Integer year) {
        return financialReleaseService.findByTypeAndName(type, month, year);
    }

    @GetMapping
    public List<FinancialRelease> findAll() {
        return financialReleaseService.findAll();
    }

    @PostMapping
    public FinancialRelease save(@RequestBody FinancialRelease financialRelease) {
        return financialReleaseService.save(financialRelease);
    }

    @DeleteMapping("{id}")
    public void delete(@PathVariable String id) {
        financialReleaseService.delete(id);
    }

    @GetMapping("{id}")
    public FinancialRelease findById(@PathVariable String id) {
        return financialReleaseService.findById(id);
    }

    @PatchMapping("{id}")
    public FinancialRelease update(@PathVariable String id, @RequestBody FinancialRelease financialRelease) {
        financialRelease.setId(id);
        return financialReleaseService.save(financialRelease);
    }

}
