# Contributing to Contract Review Skill

Thank you for your interest in contributing! This project welcomes contributions from legal experts, developers, and anyone interested in improving contract review.

## Ways to Contribute

### 1. Add Jurisdiction Knowledge

The most valuable contributions are **jurisdiction-specific legal knowledge bases**.

**Currently Available:**
- US (Employment)

**Needed:**
- China (Employment, NDA, Commercial)
- EU (GDPR, Employment)
- UK (Employment, Commercial)
- Japan, Singapore, India, etc.

#### How to Add a New Jurisdiction

1. Fork the repository
2. Create a new directory: `src/knowledge/jurisdictions/{country_code}/`
3. Add JSON file(s) following this structure:

```json
{
  "jurisdiction": {
    "country": "Country Name",
    "code": "XX",
    "primary_laws": [
      {
        "name": "Law Name",
        "citation": "Official Citation",
        "source_url": "https://official-source.gov/",
        "description": "Brief description"
      }
    ]
  },
  "risk_patterns": [
    {
      "id": "unique_id",
      "name": "Pattern Name",
      "severity": "high|medium|low",
      "description": "What this risk is",
      "recommendation": "How to mitigate"
    }
  ],
  "compliance_checklist": {
    "should_include": [...],
    "avoid_these_clauses": [...]
  },
  "metadata": {
    "version": "1.0.0",
    "last_updated": "YYYY-MM-DD",
    "sources": ["List of sources"],
    "disclaimer": "Legal disclaimer"
  }
}
```

4. Add a `sources.md` documenting official sources
5. Submit a Pull Request

### 2. Add Contract Type Knowledge

Expand coverage for different contract types:

**Currently Available:**
- Employment contracts

**Needed:**
- NDA / Confidentiality Agreements
- Service Agreements
- Software Licenses
- Procurement / Purchase Agreements
- Lease Agreements
- M&A Agreements

### 3. Add External Connectors

Connect to external legal databases:

1. Create a connector class in `src/knowledge/external/`
2. Follow the template in `connector_template.py`
3. Register in `connectors.json`
4. Document usage

**Useful APIs to integrate:**
- OpenLaws (US law)
- EUR-Lex (EU law)
- Country-specific legal databases

### 4. Improve Risk Patterns

Add or refine risk patterns in `risk_patterns.json`:

- Add industry-specific patterns
- Improve detection keywords
- Add multilingual support
- Include case law references

### 5. Improve Prompts

Enhance the analysis prompts in `src/prompts/`:

- Better structure
- More specific guidance
- Additional analysis dimensions

### 6. Bug Fixes and Features

- Fix bugs
- Improve CLI
- Add export formats
- Performance improvements

## Contribution Guidelines

### Code Standards

- Python 3.9+ compatible
- Use type hints
- Follow PEP 8
- Write docstrings
- Add tests for new features

### Knowledge Base Standards

- **Cite official sources** - Link to government websites, not blog posts
- **Include disclaimers** - This is not legal advice
- **Date your updates** - Laws change; include `last_updated`
- **Be accurate** - Have legal expertise or cite experts
- **Be neutral** - Don't favor employers or employees

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/add-china-employment`
3. Make your changes
4. Test locally: `python cli.py info`
5. Commit with clear messages
6. Push and open a Pull Request
7. Describe what you've added and cite your sources

### Legal Content Review

For jurisdiction knowledge contributions:
- Cite primary sources (government websites)
- Note the date of laws referenced
- Include a legal disclaimer
- If possible, have a legal professional review

## Questions?

- Open an Issue for questions
- Join discussions in the Issues tab
- Tag relevant contributors for specific areas

## Recognition

Contributors will be acknowledged in:
- README.md
- Release notes
- The jurisdiction/feature they contributed

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Quick Reference: Jurisdiction Knowledge Structure

```
src/knowledge/jurisdictions/{country}/
├── employment.json      # Employment/Labor law
├── nda.json            # NDA/Confidentiality
├── commercial.json     # Commercial contracts
├── data_privacy.json   # GDPR, CCPA, etc.
└── sources.md          # Documentation of sources
```

## External Resources for Research

### Open Legal Datasets
- [CUAD Dataset](https://www.atticusprojectai.org/cuad) - 510 contracts, 41 clause types
- [OpenContracts](https://github.com/JSv4/OpenContracts) - Open source platform

### Legal Information Sources
- [Cornell LII](https://www.law.cornell.edu/) - US legal encyclopedia
- [EUR-Lex](https://eur-lex.europa.eu/) - EU law
- [GovInfo](https://www.govinfo.gov/) - US government documents

### Official Government Sources
- US: [DOL](https://www.dol.gov/), [EEOC](https://www.eeoc.gov/)
- China: [China Government Legal Database](http://www.gov.cn/zhengce/)
- EU: [European Commission](https://ec.europa.eu/)
- UK: [legislation.gov.uk](https://www.legislation.gov.uk/)
