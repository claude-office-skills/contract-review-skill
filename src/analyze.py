"""Core contract analysis module using Claude API."""

import os
import json
import base64
from pathlib import Path
from typing import Optional
import anthropic

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
