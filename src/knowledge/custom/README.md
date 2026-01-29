# Custom Knowledge Base

Add your own jurisdiction-specific or company-specific knowledge here.

## How to Add Custom Knowledge

### 1. Create a JSON file

Create a JSON file following the structure in `jurisdictions/us/employment.json`:

```json
{
  "jurisdiction": {
    "country": "Your Country",
    "code": "XX",
    "primary_laws": [...]
  },
  "risk_patterns": [...],
  "compliance_checklist": {...}
}
```

### 2. File naming convention

```
custom/
├── my_company_policies.json      # Company-specific rules
├── industry_healthcare.json      # Industry-specific knowledge
└── jurisdiction_singapore.json   # Country-specific law
```

### 3. Load in your analysis

```python
from src.analyze import load_jurisdiction_knowledge

# The system will automatically check custom/ directory
knowledge = load_jurisdiction_knowledge("custom/my_company", "employment")
```

## Examples

### Company-Specific Policy File

```json
{
  "company": "Acme Corp",
  "policies": {
    "non_compete_policy": {
      "max_duration": "1 year",
      "geographic_limit": "Same state only",
      "requires_legal_review": true
    },
    "ip_assignment": {
      "excludes_personal_projects": true,
      "requires_invention_disclosure": true
    }
  },
  "risk_patterns": [
    {
      "id": "acme_specific_001",
      "name": "Missing Legal Department Review",
      "severity": "high",
      "description": "All contracts over $50k must have legal review"
    }
  ]
}
```

### Industry-Specific Knowledge

```json
{
  "industry": "Healthcare",
  "regulations": {
    "hipaa": {
      "name": "HIPAA",
      "applies_when": "Contract involves PHI (Protected Health Information)",
      "required_clauses": [
        "Business Associate Agreement",
        "PHI handling procedures",
        "Breach notification requirements"
      ]
    }
  }
}
```

## Contributing Back

If your custom knowledge could benefit others:

1. Generalize it (remove company-specific details)
2. Add to `jurisdictions/` directory
3. Submit a Pull Request

See CONTRIBUTING.md in the project root.

## Notes

- Files in `custom/` are gitignored by default
- To share with your team, commit them to your fork
- Sensitive company policies should not be committed to public repos
