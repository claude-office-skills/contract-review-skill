# Contract Review Skill

## Description

AI-powered contract analysis that identifies risks, extracts key terms, and generates professional review reports. Supports both text PDFs and scanned documents via Claude Vision.

## Capabilities

### Document Processing
- Extract and structure contract text from PDF (native text)
- Handle scanned contracts via Claude Vision
- Support mixed text+image documents

### Visual Understanding
- Detect and verify stamps/seals (公章检测)
- Identify signature areas (签名区识别)
- Validate document completeness (签章完整性检查)

### Risk Analysis
- Identify 15+ common risk patterns (限制条款、违约责任、知识产权等)
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
- 商业合同 (Business Contracts)
- 劳动合同 (Employment Contracts)
- 租赁合同 (Lease Agreements)
- NDA (保密协议)
- 采购合同 (Procurement Contracts)
- 服务协议 (Service Agreements)

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

Built with Claude by lijie420461340
