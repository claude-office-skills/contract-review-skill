# Examples

This folder contains example contracts and their analysis outputs to demonstrate the Contract Review Skill capabilities.

## Directory Structure

```
examples/
├── README.md                    # This file
├── contracts/                   # Sample contract PDFs
│   ├── sample_nda_en.pdf       # English NDA example
│   └── sample_service_cn.pdf   # Chinese service agreement
└── outputs/                     # Generated analysis outputs
    ├── nda_analysis.md         # Full risk analysis
    ├── nda_key_terms.json      # Extracted key terms
    ├── nda_completeness.json   # Completeness check
    └── comparison_report.md    # Contract comparison
```

## Quick Demo

If you have your own contracts to test:

```bash
# Set your API key
export ANTHROPIC_API_KEY="your-api-key"

# Analyze a contract
python cli.py analyze your-contract.pdf -o examples/outputs/your_analysis.md

# Extract key terms
python cli.py extract your-contract.pdf -o examples/outputs/your_terms.json

# Check completeness
python cli.py check your-contract.pdf -o examples/outputs/your_completeness.json
```

## Sample Outputs

The `outputs/` folder contains pre-generated examples showing what the analysis looks like:

### 1. Risk Analysis (`nda_analysis.md`)
Full contract analysis including:
- Contract overview
- Risk assessment (High/Medium/Low)
- Key terms summary
- Missing clauses checklist
- Recommendations

### 2. Key Terms (`nda_key_terms.json`)
Structured extraction of:
- Parties involved
- Dates and durations
- Financial terms
- Key obligations
- Dispute resolution

### 3. Completeness Check (`nda_completeness.json`)
Visual element verification:
- Signature detection
- Stamp/seal verification
- Date completeness
- Document integrity

## Note on Sample Contracts

Due to confidentiality, we don't include real contracts. You can:
1. Use your own contracts for testing
2. Use publicly available contract templates from:
   - [LawDepot](https://www.lawdepot.com/contracts/)
   - [Docracy](https://www.docracy.com/)
   - [SEC EDGAR](https://www.sec.gov/cgi-bin/browse-edgar) (public filings)
