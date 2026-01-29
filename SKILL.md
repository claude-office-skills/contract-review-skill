# Contract Review Skill

## Description

AI-powered contract analysis that identifies risks, extracts key terms, and generates professional review reports. Supports both text PDFs and scanned documents via Claude Vision.

## Capabilities

### Document Processing
- Extract and structure contract text from PDF (native text)
- Handle scanned contracts via Claude Vision
- Support mixed text+image documents

### Visual Understanding
- Detect and verify stamps/seals
- Identify signature areas
- Validate document completeness

### Risk Analysis
- Identify 15+ common risk patterns (restrictions, liability, IP, etc.)
- Compare against standard clause templates
- Generate detailed review report with recommendations

## Tools

- `analyze_contract(pdf_path)` → full analysis (text + visual elements)
- `extract_key_terms(contract_data)` → structured terms
- `identify_risks(contract_data)` → risk assessment with severity
- `check_completeness(pdf_path)` → stamps, signatures, dates
- `compare_contracts(contract_a, contract_b)` → diff report
- `generate_report(analysis, format="markdown"|"docx")` → formatted output

## Domain Knowledge

Embedded knowledge for:
- Business Contracts
- Employment Contracts
- Lease Agreements
- NDA (Non-Disclosure Agreements)
- Procurement Contracts
- Service Agreements

## Requirements

- Python 3.9+
- anthropic (Claude API)
- python-docx (DOCX output)

## Usage

```bash
# Analyze a contract
python cli.py analyze path/to/contract.pdf

# Generate report
python cli.py analyze path/to/contract.pdf --output report.md

# Compare two contracts
python cli.py compare contract_a.pdf contract_b.pdf
```

## Author

Built with Claude
