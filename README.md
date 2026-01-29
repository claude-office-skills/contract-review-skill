# Contract Review Skill 📝

> AI-powered contract analysis that identifies risks and generates professional review reports.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)

## What is this?

**Contract Review Skill** is a Claude Agent Skill that helps you analyze contracts automatically. It's not just text extraction — it's **intelligent review** with domain knowledge.

### Key Features

- 🔍 **Risk Detection**: Identifies 15+ common risk patterns (限制条款、违约责任、知识产权等)
- 📄 **PDF Support**: Handles text PDFs, scanned documents, and mixed files
- 🔏 **Visual Understanding**: Detects stamps, signatures, and validates completeness
- 📊 **Structured Output**: Generates Markdown or DOCX reports
- 🌐 **Bilingual**: Supports both English and Chinese contracts

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/lijie420461340/contract-review-skill.git
cd contract-review-skill

# Install dependencies
pip install -r requirements.txt

# Set your Claude API key
export ANTHROPIC_API_KEY="your-api-key"
```

### Basic Usage

```bash
# Analyze a contract
python cli.py analyze path/to/contract.pdf

# Generate a detailed report
python cli.py analyze path/to/contract.pdf --output report.md --format markdown

# Compare two contracts
python cli.py compare old_contract.pdf new_contract.pdf
```

### As a Claude Skill

Place this folder in your Claude skills directory, and Claude will automatically use it when you ask to review contracts.

## Example Output

```markdown
# Contract Analysis Report

## Overview
- Contract Type: 服务协议 (Service Agreement)
- Parties: Company A ↔ Company B
- Effective Date: 2025-01-01
- Term: 12 months

## Risk Assessment

### 🔴 High Risk (2 items)
1. **Unlimited Liability Clause** (Section 8.2)
   - Issue: No cap on indemnification
   - Recommendation: Add liability cap at 12 months of fees

2. **Broad IP Assignment** (Section 5.1)
   - Issue: Assigns all work product including pre-existing IP
   - Recommendation: Exclude pre-existing IP from assignment

### 🟡 Medium Risk (3 items)
...

## Completeness Check
- ✅ Party A Signature: Detected
- ✅ Party A Stamp: Detected
- ⚠️ Party B Signature: Not found
- ❌ Date: Missing
```

## Supported Contract Types

| Type | Chinese | Status |
|------|---------|--------|
| Business Contract | 商业合同 | ✅ |
| Employment Contract | 劳动合同 | ✅ |
| NDA | 保密协议 | ✅ |
| Lease Agreement | 租赁合同 | ✅ |
| Service Agreement | 服务协议 | ✅ |
| Procurement Contract | 采购合同 | ✅ |

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                 Contract PDF                         │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│        Claude (Native PDF + Vision Support)          │
│  • Text extraction                                   │
│  • Image/scan recognition                            │
│  • Stamp & signature detection                       │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│              Risk Analysis Engine                    │
│  • Pattern matching against risk_patterns.json       │
│  • Clause classification                             │
│  • Severity assessment                               │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│              Structured Report Output                │
│  • Markdown / DOCX                                   │
│  • Risk summary with recommendations                 │
│  • Completeness checklist                            │
└─────────────────────────────────────────────────────┘
```

## Configuration

Set your API key:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Or create a `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Cost Estimation

| Operation | Estimated Cost |
|-----------|---------------|
| Single contract analysis | ~$0.02-0.05 |
| Contract comparison | ~$0.04-0.08 |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Areas for Contribution

- [ ] Add more risk patterns
- [ ] Support more contract types
- [ ] Improve Chinese contract recognition
- [ ] Add more output formats (PDF, HTML)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Claude Skills Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)
- [Anthropic Skills Repository](https://github.com/anthropics/skills)

---

Built with ❤️ using Claude
