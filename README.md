# Contract Review Skill 📝

> AI-powered contract analysis that identifies risks and generates professional review reports.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/claude-office-skills/contract-review-skill)

## 🚀 Quick Try

**Live Demo**: Deploy your own instance using the button above, or run locally.

**Claude Desktop/Cursor**: After deployment, add to your MCP config:
```json
{
  "mcpServers": {
    "contract-review": {
      "url": "https://contract-review-skill.YOUR_SUBDOMAIN.workers.dev/mcp"
    }
  }
}
```

## What is this?

**Contract Review Skill** is a Claude Agent Skill that helps you analyze contracts automatically. It's not just text extraction — it's **intelligent review** with domain knowledge.

### Key Features

- 🔍 **Risk Detection**: Identifies 15+ common risk patterns (restrictions, liability, IP, etc.)
- 📄 **PDF Support**: Handles text PDFs, scanned documents, and mixed files
- 🔏 **Visual Understanding**: Detects stamps, signatures, and validates completeness
- 📊 **Structured Output**: Generates Markdown or DOCX reports
- 🌐 **Bilingual**: Supports both English and Chinese contracts
- ☁️ **Cloud Ready**: Deploy to Cloudflare Workers for free

---

## 🎯 Three Ways to Use

### Option 1: Claude Desktop / Cursor (MCP)

Add to `~/.config/claude/config.json` or Cursor settings:

```json
{
  "mcpServers": {
    "contract-review": {
      "url": "https://contract-review-skill.workers.dev/mcp"
    }
  }
}
```

Then in Claude/Cursor, just say:
> "Analyze this employment contract and identify risks"

### Option 2: HTTP API

```bash
# Analyze a contract
curl -X POST https://contract-review-skill.workers.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "CONTRACT TEXT HERE...", "jurisdiction": "us"}'

# Check completeness
curl -X POST https://contract-review-skill.workers.dev/api/check \
  -H "Content-Type: application/json" \
  -d '{"content": "CONTRACT TEXT HERE..."}'

# Extract key terms
curl -X POST https://contract-review-skill.workers.dev/api/extract \
  -H "Content-Type: application/json" \
  -d '{"content": "CONTRACT TEXT HERE..."}'
```

### Option 3: Local CLI (Python)

```bash
# Clone the repository
git clone https://github.com/claude-office-skills/contract-review-skill.git
cd contract-review-skill

# Install dependencies
pip install -r requirements.txt

# Set your Claude API key
export ANTHROPIC_API_KEY="your-api-key"

# Analyze a contract
python cli.py analyze path/to/contract.pdf

# Generate a detailed report
python cli.py analyze path/to/contract.pdf --output report.md --format markdown
```

---

## ☁️ Deploy Your Own (Free)

### Cloudflare Workers (Recommended)

1. **One-Click Deploy**

   [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/claude-office-skills/contract-review-skill)

2. **Manual Deploy**

   ```bash
   cd worker
   npm install
   
   # Set your API key
   wrangler secret put ANTHROPIC_API_KEY
   
   # Deploy
   npm run deploy
   ```

3. **GitHub Actions (Auto-Deploy)**

   Set these secrets in your GitHub repo:
   - `CF_API_TOKEN`: Cloudflare API token ([create here](https://dash.cloudflare.com/profile/api-tokens))
   - `CF_ACCOUNT_ID`: Your Cloudflare account ID
   - `ANTHROPIC_API_KEY`: Your Claude API key

   Push to `main` branch and it auto-deploys!

### Free Tier Limits

| Resource | Free Allowance |
|----------|---------------|
| Requests | 100,000/day |
| CPU Time | 10ms/request |
| Storage | 10GB (R2) |

This is **more than enough** for testing and small teams.

---

## 📊 Architecture

> **Note**: This is the **Advanced** version of [Claude Office Skills](https://github.com/claude-office-skills/skills). For simple usage, just copy a SKILL.md file - no deployment needed!

![Claude Office Skills Architecture](./architecture.png)

This repository provides the **Advanced (Power Users)** features shown on the right side of the diagram.

---

## 📝 Example Output

```markdown
# Contract Analysis Report

## Executive Summary
This is a standard employment agreement with several high-risk clauses 
that require attention before signing.

## Identified Risks

### 🔴 High Risk

1. **Unlimited Liability Clause** (Section 8.2)
   - Issue: No cap on indemnification
   - Recommendation: Add liability cap at 12 months of fees

2. **Broad IP Assignment** (Section 5.1)
   - Issue: Assigns all work product including pre-existing IP
   - Recommendation: Exclude pre-existing IP from assignment

### 🟡 Medium Risk

3. **Non-Compete (3 years)** (Section 9)
   - Issue: Duration exceeds California law limits
   - Recommendation: Reduce to 1 year or remove

## Completeness Check
- ✅ Parties Identified
- ✅ Effective Date
- ✅ Term Duration
- ⚠️ Governing Law (implied, not explicit)
- ❌ Dispute Resolution clause missing

## Overall Assessment: ⚠️ REVIEW NEEDED
```

---

## 🔧 API Reference

### MCP Tools

| Tool | Description |
|------|-------------|
| `analyze_contract` | Full risk analysis of a contract |
| `check_completeness` | Verify all required elements present |
| `extract_key_terms` | Extract structured data from contract |
| `list_jurisdictions` | List available legal knowledge bases |

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Analyze contract for risks |
| `/api/check` | POST | Check contract completeness |
| `/api/extract` | POST | Extract key terms as JSON |
| `/api/jurisdictions` | POST | List jurisdiction knowledge |
| `/mcp` | POST | MCP protocol endpoint |
| `/health` | GET | Health check |

---

## 🌍 Supported Jurisdictions

| Code | Name | Status |
|------|------|--------|
| `us` | United States | ✅ Full |
| `eu` | European Union | ✅ Full |
| `cn` | China | ✅ Full |
| `auto` | Auto-detect | ✅ Default |

---

## 💰 Cost Estimation

| Operation | Estimated Cost |
|-----------|---------------|
| Single contract analysis | ~$0.02-0.05 |
| Contract comparison | ~$0.04-0.08 |
| Cloudflare Workers | **Free** (100K req/day) |

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas for Contribution

- [ ] Add more jurisdiction knowledge (UK, Japan, etc.)
- [ ] Support more contract types
- [ ] Improve Chinese contract recognition
- [ ] Add PDF upload to demo page
- [ ] Implement caching with Cloudflare KV

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- [Live Demo](https://contract-review-skill.workers.dev)
- [Claude Skills Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Cloudflare Workers](https://workers.cloudflare.com)

---

Built with ❤️ using Claude + Cloudflare Workers
