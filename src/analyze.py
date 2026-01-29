"""Core contract analysis module using Claude API."""

import os
import json
import base64
import re
from pathlib import Path
from typing import Optional, Literal
from datetime import datetime
import anthropic

try:
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.style import WD_STYLE_TYPE
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

# Load prompts and knowledge
PROMPTS_DIR = Path(__file__).parent / "prompts"
KNOWLEDGE_DIR = Path(__file__).parent / "knowledge"


def load_prompt(name: str) -> str:
    """Load a prompt template from the prompts directory."""
    prompt_path = PROMPTS_DIR / f"{name}.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    raise FileNotFoundError(f"Prompt template not found: {name}")


def load_risk_patterns() -> dict:
    """Load risk patterns from knowledge base."""
    patterns_path = KNOWLEDGE_DIR / "risk_patterns.json"
    if patterns_path.exists():
        return json.loads(patterns_path.read_text(encoding="utf-8"))
    return {"patterns": []}


def encode_pdf(pdf_path: str) -> str:
    """Encode PDF file to base64."""
    with open(pdf_path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def analyze_contract(
    pdf_path: str,
    api_key: Optional[str] = None,
    model: str = "claude-sonnet-4-20250514"
) -> dict:
    """
    Analyze a contract PDF and return structured analysis.
    
    Args:
        pdf_path: Path to the PDF file
        api_key: Claude API key (defaults to ANTHROPIC_API_KEY env var)
        model: Claude model to use
        
    Returns:
        dict with analysis results
    """
    # Initialize client
    client = anthropic.Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
    
    # Load prompt and knowledge
    analysis_prompt = load_prompt("risk_analysis")
    risk_patterns = load_risk_patterns()
    
    # Encode PDF
    pdf_data = encode_pdf(pdf_path)
    
    # Build the full prompt with risk patterns
    full_prompt = f"""{analysis_prompt}

## Risk Patterns Reference

{json.dumps(risk_patterns, ensure_ascii=False, indent=2)}

---

Please analyze the attached contract and provide a structured analysis following the format above.
"""
    
    # Call Claude API with PDF
    response = client.messages.create(
        model=model,
        max_tokens=8192,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_data
                        }
                    },
                    {
                        "type": "text",
                        "text": full_prompt
                    }
                ]
            }
        ]
    )
    
    # Extract the response text
    analysis_text = response.content[0].text
    
    return {
        "status": "success",
        "analysis": analysis_text,
        "model": model,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens
        }
    }


def check_completeness(
    pdf_path: str,
    api_key: Optional[str] = None,
    model: str = "claude-sonnet-4-20250514"
) -> dict:
    """
    Check contract completeness (signatures, stamps, dates).
    
    Args:
        pdf_path: Path to the PDF file
        api_key: Claude API key
        model: Claude model to use
        
    Returns:
        dict with completeness check results
    """
    client = anthropic.Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
    
    pdf_data = encode_pdf(pdf_path)
    
    prompt = """请检查这份合同的完整性，重点关注以下方面：

1. **签名检查**
   - 甲方签名是否存在
   - 乙方签名是否存在
   - 签名位置是否正确

2. **公章检查**
   - 甲方公章是否存在
   - 乙方公章是否存在
   - 公章是否清晰可辨

3. **日期检查**
   - 签署日期是否填写
   - 生效日期是否明确
   - 日期格式是否规范

4. **其他要素**
   - 合同编号是否存在
   - 页码是否完整
   - 骑缝章（如有多页）

请以 JSON 格式输出检查结果：
```json
{
  "signatures": {
    "party_a": {"present": bool, "location": "描述"},
    "party_b": {"present": bool, "location": "描述"}
  },
  "stamps": {
    "party_a": {"present": bool, "clear": bool},
    "party_b": {"present": bool, "clear": bool}
  },
  "dates": {
    "signing_date": {"present": bool, "value": "日期或null"},
    "effective_date": {"present": bool, "value": "日期或null"}
  },
  "other": {
    "contract_number": {"present": bool, "value": "编号或null"},
    "page_numbers": {"present": bool, "complete": bool}
  },
  "overall_completeness": "完整/部分完整/不完整",
  "issues": ["问题1", "问题2"]
}
```
"""
    
    response = client.messages.create(
        model=model,
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_data
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    )
    
    return {
        "status": "success",
        "result": response.content[0].text,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens
        }
    }


def compare_contracts(
    pdf_path_a: str,
    pdf_path_b: str,
    api_key: Optional[str] = None,
    model: str = "claude-sonnet-4-20250514"
) -> dict:
    """
    Compare two contracts and highlight differences.
    
    Args:
        pdf_path_a: Path to the first PDF
        pdf_path_b: Path to the second PDF
        api_key: Claude API key
        model: Claude model to use
        
    Returns:
        dict with comparison results
    """
    client = anthropic.Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
    
    pdf_data_a = encode_pdf(pdf_path_a)
    pdf_data_b = encode_pdf(pdf_path_b)
    
    prompt = """请对比这两份合同，分析它们的差异：

## 对比维度

1. **基本信息差异**
   - 合同类型
   - 当事人
   - 期限
   - 金额

2. **条款差异**
   - 新增的条款
   - 删除的条款
   - 修改的条款（标注具体变化）

3. **风险变化**
   - 风险增加的条款
   - 风险降低的条款

4. **建议**
   - 是否建议接受变更
   - 需要注意的问题

请以结构化的 Markdown 格式输出对比报告。
第一份文档标记为 [合同A]，第二份文档标记为 [合同B]。
"""
    
    response = client.messages.create(
        model=model,
        max_tokens=8192,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_data_a
                        }
                    },
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_data_b
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    )
    
    return {
        "status": "success",
        "comparison": response.content[0].text,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens
        }
    }


def extract_key_terms(
    pdf_path: str,
    api_key: Optional[str] = None,
    model: str = "claude-sonnet-4-20250514"
) -> dict:
    """
    Extract key terms from a contract in structured JSON format.
    
    Args:
        pdf_path: Path to the PDF file
        api_key: Claude API key
        model: Claude model to use
        
    Returns:
        dict with extracted key terms
    """
    client = anthropic.Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
    
    pdf_data = encode_pdf(pdf_path)
    
    prompt = """请从这份合同中提取关键条款，以 JSON 格式输出：

```json
{
  "contract_type": "合同类型",
  "parties": {
    "party_a": {
      "name": "甲方名称",
      "role": "甲方角色（如：雇主、卖方）",
      "address": "地址（如有）"
    },
    "party_b": {
      "name": "乙方名称", 
      "role": "乙方角色（如：员工、买方）",
      "address": "地址（如有）"
    }
  },
  "dates": {
    "effective_date": "生效日期",
    "end_date": "终止日期",
    "signing_date": "签署日期"
  },
  "financial_terms": {
    "total_value": "合同总金额",
    "payment_terms": "付款条款",
    "currency": "货币单位"
  },
  "key_clauses": [
    {
      "name": "条款名称",
      "section": "所在章节",
      "summary": "条款摘要",
      "original_text": "原文节选"
    }
  ],
  "obligations": {
    "party_a": ["甲方义务1", "甲方义务2"],
    "party_b": ["乙方义务1", "乙方义务2"]
  },
  "termination": {
    "conditions": ["终止条件"],
    "notice_period": "通知期限",
    "consequences": "终止后果"
  },
  "confidentiality": {
    "scope": "保密范围",
    "duration": "保密期限",
    "exceptions": ["例外情况"]
  },
  "dispute_resolution": {
    "method": "解决方式（诉讼/仲裁）",
    "jurisdiction": "管辖地",
    "governing_law": "适用法律"
  }
}
```

请确保：
1. 如果某项信息不存在，填写 null
2. 日期格式统一为 YYYY-MM-DD
3. 金额包含货币符号
4. 只返回 JSON，不要其他解释
"""
    
    response = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_data
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    )
    
    response_text = response.content[0].text
    
    # Try to parse JSON from response
    try:
        # Extract JSON from markdown code block if present
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = response_text
        
        key_terms = json.loads(json_str)
    except json.JSONDecodeError:
        key_terms = {"raw_response": response_text, "parse_error": True}
    
    return {
        "status": "success",
        "key_terms": key_terms,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens
        }
    }


def generate_report(
    analysis: str,
    output_path: str,
    format: Literal["markdown", "docx"] = "markdown",
    title: str = "Contract Analysis Report"
) -> dict:
    """
    Generate a formatted report from analysis results.
    
    Args:
        analysis: The analysis text (markdown format)
        output_path: Path to save the report
        format: Output format ("markdown" or "docx")
        title: Report title
        
    Returns:
        dict with status and output path
    """
    output_path = Path(output_path)
    
    if format == "markdown":
        # Add header and metadata
        report_content = f"""# {title}

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Tool:** Contract Review Skill v0.1.0

---

{analysis}

---

*This report was generated by Contract Review Skill using Claude AI.*
*https://github.com/lijie420461340/contract-review-skill*
"""
        output_path.write_text(report_content, encoding="utf-8")
        return {"status": "success", "output_path": str(output_path), "format": "markdown"}
    
    elif format == "docx":
        if not DOCX_AVAILABLE:
            return {
                "status": "error",
                "message": "python-docx not installed. Run: pip install python-docx"
            }
        
        doc = Document()
        
        # Add title
        title_para = doc.add_heading(title, 0)
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Add metadata
        meta = doc.add_paragraph()
        meta.add_run(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n").italic = True
        meta.add_run("Tool: Contract Review Skill v0.1.0").italic = True
        
        doc.add_paragraph()  # Spacer
        
        # Parse markdown and convert to DOCX
        lines = analysis.split('\n')
        current_list = None
        
        for line in lines:
            line = line.rstrip()
            
            # Headers
            if line.startswith('### '):
                doc.add_heading(line[4:], level=3)
            elif line.startswith('## '):
                doc.add_heading(line[3:], level=2)
            elif line.startswith('# '):
                doc.add_heading(line[2:], level=1)
            
            # Bullet points
            elif line.startswith('- ') or line.startswith('* '):
                doc.add_paragraph(line[2:], style='List Bullet')
            
            # Numbered lists
            elif re.match(r'^\d+\. ', line):
                doc.add_paragraph(re.sub(r'^\d+\. ', '', line), style='List Number')
            
            # Bold text handling
            elif line.startswith('**') and line.endswith('**'):
                p = doc.add_paragraph()
                p.add_run(line.strip('*')).bold = True
            
            # Regular paragraph
            elif line.strip():
                # Handle inline formatting
                p = doc.add_paragraph()
                
                # Simple bold/italic parsing
                parts = re.split(r'(\*\*.*?\*\*|\*.*?\*)', line)
                for part in parts:
                    if part.startswith('**') and part.endswith('**'):
                        p.add_run(part[2:-2]).bold = True
                    elif part.startswith('*') and part.endswith('*'):
                        p.add_run(part[1:-1]).italic = True
                    else:
                        p.add_run(part)
            
            # Empty line = paragraph break
            elif not line.strip():
                pass  # Skip empty lines (already handled by paragraph structure)
        
        # Add footer
        doc.add_paragraph()
        footer = doc.add_paragraph()
        footer.add_run("This report was generated by Contract Review Skill using Claude AI.").italic = True
        footer.add_run("\nhttps://github.com/lijie420461340/contract-review-skill").italic = True
        
        doc.save(str(output_path))
        return {"status": "success", "output_path": str(output_path), "format": "docx"}
    
    else:
        return {"status": "error", "message": f"Unknown format: {format}"}
