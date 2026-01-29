#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ============================================
// Risk Patterns Knowledge Base
// ============================================
const RISK_PATTERNS = {
  unlimited_liability: {
    name: "Unlimited Liability",
    name_zh: "无限责任",
    description: "Contract may expose party to unlimited financial liability",
    description_zh: "合同可能使一方承担无限的经济责任",
    severity: "high",
    keywords: ["unlimited liability", "full responsibility", "all damages", "any and all losses"],
    keywords_zh: ["无限责任", "全部责任", "一切损失", "全部损害"],
    recommendation: "Add liability cap (e.g., 12 months of fees or contract value)",
    recommendation_zh: "添加责任上限（如12个月费用或合同金额）"
  },
  unfair_termination: {
    name: "Unfair Termination",
    name_zh: "不公平终止条款",
    description: "Termination clauses may be one-sided or unfair",
    description_zh: "终止条款可能是单方面的或不公平的",
    severity: "medium",
    keywords: ["terminate at will", "immediate termination", "without cause", "sole discretion"],
    keywords_zh: ["随时终止", "立即终止", "无需理由", "单方决定"],
    recommendation: "Ensure mutual termination rights with reasonable notice period",
    recommendation_zh: "确保双方都有终止权，并有合理的通知期"
  },
  broad_ip_assignment: {
    name: "Broad IP Assignment",
    name_zh: "宽泛的知识产权转让",
    description: "Intellectual property rights may be transferred without adequate protection",
    description_zh: "知识产权可能在没有充分保护的情况下被转让",
    severity: "high",
    keywords: ["work for hire", "assign all rights", "intellectual property transfer", "all inventions"],
    keywords_zh: ["职务作品", "转让全部权利", "知识产权转让", "所有发明"],
    recommendation: "Exclude pre-existing IP and clearly define scope of assignment",
    recommendation_zh: "排除已有知识产权，明确转让范围"
  },
  perpetual_confidentiality: {
    name: "Perpetual Confidentiality",
    name_zh: "永久保密义务",
    description: "Confidentiality obligations may be overly broad or perpetual",
    description_zh: "保密义务可能过于宽泛或永久",
    severity: "medium",
    keywords: ["perpetual confidentiality", "indefinitely", "all information", "unlimited duration", "in perpetuity"],
    keywords_zh: ["永久保密", "无限期", "所有信息", "无限制期限"],
    recommendation: "Limit confidentiality period (typically 2-5 years)",
    recommendation_zh: "限制保密期限（通常2-5年）"
  },
  one_sided_indemnification: {
    name: "One-Sided Indemnification",
    name_zh: "单方面赔偿条款",
    description: "Indemnification obligations may be imbalanced",
    description_zh: "赔偿义务可能不平衡",
    severity: "high",
    keywords: ["indemnify and hold harmless", "defend at own expense", "all claims", "any losses"],
    keywords_zh: ["赔偿并使免受损害", "自费辩护", "所有索赔", "任何损失"],
    recommendation: "Ensure mutual indemnification and reasonable scope limitations",
    recommendation_zh: "确保相互赔偿，并有合理的范围限制"
  },
  mandatory_arbitration: {
    name: "Mandatory Arbitration",
    name_zh: "强制仲裁",
    description: "Disputes must be resolved through arbitration, limiting legal options",
    description_zh: "争议必须通过仲裁解决，限制了法律选择",
    severity: "medium",
    keywords: ["binding arbitration", "waive jury trial", "sole remedy", "exclusive arbitration"],
    keywords_zh: ["约束性仲裁", "放弃陪审团审判", "唯一救济", "排他性仲裁"],
    recommendation: "Consider if arbitration is appropriate; ensure fair arbitrator selection",
    recommendation_zh: "考虑仲裁是否合适；确保仲裁员选择公平"
  },
  excessive_noncompete: {
    name: "Excessive Non-Compete",
    name_zh: "过度竞业限制",
    description: "Non-compete clause may be overly restrictive",
    description_zh: "竞业限制条款可能过于严格",
    severity: "high",
    keywords: ["non-compete", "not compete", "competitive business", "competitor"],
    keywords_zh: ["竞业限制", "不得竞争", "竞争业务", "竞争对手"],
    recommendation: "Limit duration (1-2 years max), geographic scope",
    recommendation_zh: "限制期限（最长1-2年）、地域范围"
  },
  auto_renewal: {
    name: "Auto-Renewal",
    name_zh: "自动续约",
    description: "Contract may automatically renew without explicit consent",
    description_zh: "合同可能自动续约",
    severity: "low",
    keywords: ["automatically renew", "unless cancelled", "evergreen", "auto-renew"],
    keywords_zh: ["自动续约", "除非取消", "长青条款"],
    recommendation: "Ensure clear opt-out process",
    recommendation_zh: "确保有明确的退出程序"
  }
};

// ============================================
// Jurisdiction Knowledge
// ============================================
const JURISDICTION_KNOWLEDGE = {
  us: {
    name: "United States",
    name_zh: "美国",
    key_laws: [
      { name: "Fair Labor Standards Act (FLSA)", description: "Federal minimum wage, overtime standards" },
      { name: "At-Will Employment", description: "Employment can be terminated by either party" },
      { name: "Title VII Civil Rights Act", description: "Prohibits employment discrimination" }
    ],
    risk_focus: [
      "Minimum wage compliance ($7.25 federal, higher in many states)",
      "Overtime pay (1.5x for hours over 40/week)",
      "Non-compete enforceability varies by state",
      "California: Non-competes generally unenforceable"
    ]
  },
  eu: {
    name: "European Union",
    name_zh: "欧盟",
    key_laws: [
      { name: "GDPR", description: "Data protection regulation" },
      { name: "Working Time Directive", description: "Maximum 48-hour work week" },
      { name: "Employee Rights Directive", description: "Information and consultation rights" }
    ],
    risk_focus: [
      "GDPR compliance mandatory",
      "Working hour limits (48 hours/week)",
      "Mandatory notice periods for termination",
      "Strong protections against unfair dismissal"
    ]
  },
  cn: {
    name: "China",
    name_zh: "中国",
    key_laws: [
      { name: "劳动合同法", description: "核心劳动法规" },
      { name: "社会保险法", description: "强制社保缴纳" },
      { name: "就业促进法", description: "反歧视规定" }
    ],
    risk_focus: [
      "书面合同30天内签订",
      "竞业限制最长2年",
      "竞业限制需支付补偿（通常30%工资）",
      "五险一金强制缴纳"
    ]
  },
  uk: {
    name: "United Kingdom",
    name_zh: "英国",
    key_laws: [
      { name: "Employment Rights Act 1996", description: "Core employment rights" },
      { name: "Equality Act 2010", description: "Anti-discrimination" },
      { name: "UK GDPR", description: "Data protection" }
    ],
    risk_focus: [
      "Statutory minimum notice periods",
      "Unfair dismissal protection after 2 years",
      "Minimum 5.6 weeks paid holiday"
    ]
  }
};

// Completeness checklist
const COMPLETENESS_CHECKLIST = [
  { id: "parties", name: "Parties Identified", name_zh: "当事人明确" },
  { id: "effective_date", name: "Effective Date", name_zh: "生效日期" },
  { id: "term", name: "Term/Duration", name_zh: "期限" },
  { id: "consideration", name: "Compensation", name_zh: "报酬" },
  { id: "signatures", name: "Signature Blocks", name_zh: "签名栏" },
  { id: "governing_law", name: "Governing Law", name_zh: "适用法律" },
  { id: "dispute_resolution", name: "Dispute Resolution", name_zh: "争议解决" },
  { id: "termination", name: "Termination Clause", name_zh: "终止条款" },
  { id: "confidentiality", name: "Confidentiality", name_zh: "保密条款" },
  { id: "amendment", name: "Amendment Process", name_zh: "修改程序" }
];

// ============================================
// Utility Functions
// ============================================

function detectLanguage(text) {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
  const totalChars = text.replace(/\s/g, '').length;
  const chineseRatio = chineseChars.length / totalChars;
  if (chineseRatio > 0.3) return 'zh';
  return 'en';
}

function scanForRisks(text) {
  const results = [];
  const textLower = text.toLowerCase();
  const sentences = text.split(/[.。!！?？\n]+/);
  const language = detectLanguage(text);

  for (const [patternId, pattern] of Object.entries(RISK_PATTERNS)) {
    const matchedKeywords = [];
    let contextSentence = '';

    for (const keyword of pattern.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        const matchingSentence = sentences.find(s => s.toLowerCase().includes(keyword.toLowerCase()));
        if (matchingSentence && !contextSentence) {
          contextSentence = matchingSentence.trim().substring(0, 200);
        }
      }
    }

    for (const keyword of pattern.keywords_zh) {
      if (text.includes(keyword)) {
        matchedKeywords.push(keyword);
        const matchingSentence = sentences.find(s => s.includes(keyword));
        if (matchingSentence && !contextSentence) {
          contextSentence = matchingSentence.trim().substring(0, 200);
        }
      }
    }

    if (matchedKeywords.length > 0) {
      results.push({
        risk_id: patternId,
        name: language === 'zh' ? pattern.name_zh : pattern.name,
        severity: pattern.severity,
        description: language === 'zh' ? pattern.description_zh : pattern.description,
        matched_keywords: matchedKeywords,
        context: contextSentence,
        recommendation: language === 'zh' ? pattern.recommendation_zh : pattern.recommendation
      });
    }
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return results;
}

function checkCompleteness(text) {
  const textLower = text.toLowerCase();
  const language = detectLanguage(text);
  const results = [];

  const checks = {
    parties: { patterns: ['party', 'between', 'employer', 'employee'], patterns_zh: ['甲方', '乙方'] },
    effective_date: { patterns: ['effective date', 'dated', 'as of'], patterns_zh: ['生效日期'] },
    term: { patterns: ['term', 'duration', 'period'], patterns_zh: ['期限', '有效期'] },
    consideration: { patterns: ['compensation', 'salary', 'payment', '$'], patterns_zh: ['报酬', '薪资', '元'] },
    signatures: { patterns: ['signature', 'signed by'], patterns_zh: ['签名', '签章'] },
    governing_law: { patterns: ['governing law', 'governed by'], patterns_zh: ['适用法律', '管辖'] },
    dispute_resolution: { patterns: ['dispute', 'arbitration'], patterns_zh: ['争议', '仲裁'] },
    termination: { patterns: ['termination', 'terminate'], patterns_zh: ['终止', '解除'] },
    confidentiality: { patterns: ['confidential', 'non-disclosure'], patterns_zh: ['保密', '机密'] },
    amendment: { patterns: ['amendment', 'modify'], patterns_zh: ['修改', '变更'] }
  };

  for (const item of COMPLETENESS_CHECKLIST) {
    const check = checks[item.id];
    let found = false;

    if (check) {
      for (const pattern of check.patterns) {
        if (textLower.includes(pattern)) { found = true; break; }
      }
      if (!found) {
        for (const pattern of check.patterns_zh) {
          if (text.includes(pattern)) { found = true; break; }
        }
      }
    }

    results.push({
      element: language === 'zh' ? item.name_zh : item.name,
      found
    });
  }

  return results;
}

// ============================================
// MCP Server Setup
// ============================================

const server = new Server(
  { name: "contract-review-skill", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "scan_contract_risks",
      description: "扫描合同文本中的潜在风险。返回匹配的风险及严重程度、关键词和上下文。",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "要扫描的合同文本" }
        },
        required: ["content"]
      }
    },
    {
      name: "check_contract_completeness",
      description: "检查合同是否包含必要元素（当事人、日期、签名等）。返回检查清单。",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "要检查的合同文本" }
        },
        required: ["content"]
      }
    },
    {
      name: "get_jurisdiction_knowledge",
      description: "获取特定司法管辖区的法律知识，包括关键法律和风险关注点。",
      inputSchema: {
        type: "object",
        properties: {
          jurisdiction: { type: "string", description: "司法管辖区代码: us, eu, cn, uk", enum: ["us", "eu", "cn", "uk"] }
        },
        required: ["jurisdiction"]
      }
    },
    {
      name: "list_risk_patterns",
      description: "列出所有可用的风险模式及其ID、名称和严重级别。",
      inputSchema: { type: "object", properties: {} }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "scan_contract_risks": {
      const risks = scanForRisks(args.content);
      const summary = risks.length > 0
        ? `发现 ${risks.length} 个潜在风险 (高风险: ${risks.filter(r => r.severity === 'high').length}, 中风险: ${risks.filter(r => r.severity === 'medium').length}, 低风险: ${risks.filter(r => r.severity === 'low').length})`
        : "未发现明显风险";

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ summary, risks }, null, 2)
        }]
      };
    }

    case "check_contract_completeness": {
      const results = checkCompleteness(args.content);
      const found = results.filter(r => r.found).length;
      const total = results.length;
      const missing = results.filter(r => !r.found).map(r => r.element);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            score: `${found}/${total} (${Math.round(found/total*100)}%)`,
            checklist: results,
            missing_elements: missing
          }, null, 2)
        }]
      };
    }

    case "get_jurisdiction_knowledge": {
      const knowledge = JURISDICTION_KNOWLEDGE[args.jurisdiction];
      if (!knowledge) {
        return {
          content: [{ type: "text", text: `未知的司法管辖区: ${args.jurisdiction}。可用: us, eu, cn, uk` }]
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(knowledge, null, 2) }]
      };
    }

    case "list_risk_patterns": {
      const patterns = Object.entries(RISK_PATTERNS).map(([id, p]) => ({
        id, name: p.name, name_zh: p.name_zh, severity: p.severity
      }));
      return {
        content: [{ type: "text", text: JSON.stringify({ patterns }, null, 2) }]
      };
    }

    default:
      return { content: [{ type: "text", text: `未知工具: ${name}` }] };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
