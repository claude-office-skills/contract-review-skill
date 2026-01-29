/**
 * Contract Review Skill - Cloudflare Worker
 * 
 * Client-side AI Mode: No API key required!
 * 
 * This worker provides:
 * 1. MCP Tools for Claude Desktop/Cursor to use
 * 2. Knowledge base lookups (risk patterns, jurisdictions)
 * 3. Text processing utilities
 * 
 * The actual AI analysis is done by Claude on the client side.
 */

export interface Env {
  ENVIRONMENT: string;
}

// ============================================
// Risk Patterns Knowledge Base
// ============================================
const RISK_PATTERNS: Record<string, {
  name: string;
  name_zh: string;
  description: string;
  description_zh: string;
  severity: 'high' | 'medium' | 'low';
  keywords: string[];
  keywords_zh: string[];
  recommendation: string;
  recommendation_zh: string;
}> = {
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
    recommendation: "Limit confidentiality period (typically 2-5 years) and clearly define confidential information",
    recommendation_zh: "限制保密期限（通常2-5年），明确定义保密信息"
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
    description: "Non-compete clause may be overly restrictive in scope, duration, or geography",
    description_zh: "竞业限制条款在范围、期限或地域上可能过于严格",
    severity: "high",
    keywords: ["non-compete", "not compete", "competitive business", "competitor"],
    keywords_zh: ["竞业限制", "不得竞争", "竞争业务", "竞争对手"],
    recommendation: "Limit duration (1-2 years max), geographic scope, and industry definition",
    recommendation_zh: "限制期限（最长1-2年）、地域范围和行业定义"
  },
  auto_renewal: {
    name: "Auto-Renewal",
    name_zh: "自动续约",
    description: "Contract may automatically renew without explicit consent",
    description_zh: "合同可能在没有明确同意的情况下自动续约",
    severity: "low",
    keywords: ["automatically renew", "unless cancelled", "evergreen", "auto-renew"],
    keywords_zh: ["自动续约", "除非取消", "长青条款", "自动续期"],
    recommendation: "Ensure clear opt-out process and reasonable notice period for cancellation",
    recommendation_zh: "确保有明确的退出程序和合理的取消通知期"
  },
  wage_compliance: {
    name: "Wage Law Compliance",
    name_zh: "工资法合规",
    description: "Payment terms may not comply with labor laws",
    description_zh: "支付条款可能不符合劳动法",
    severity: "high",
    keywords: ["minimum wage", "overtime", "pay period", "final paycheck", "hourly rate"],
    keywords_zh: ["最低工资", "加班", "支付周期", "最终工资", "小时工资"],
    recommendation: "Verify compliance with federal and state wage laws",
    recommendation_zh: "核实是否符合联邦和地方工资法"
  },
  data_processing: {
    name: "Data Processing Without Consent",
    name_zh: "未经同意的数据处理",
    description: "Personal data may be processed without proper consent or safeguards",
    description_zh: "个人数据可能在没有适当同意或保护措施的情况下被处理",
    severity: "high",
    keywords: ["personal data", "data processing", "collect information", "share data", "third party"],
    keywords_zh: ["个人数据", "数据处理", "收集信息", "共享数据", "第三方"],
    recommendation: "Ensure GDPR/privacy law compliance with clear consent and data protection terms",
    recommendation_zh: "确保符合GDPR/隐私法，有明确的同意和数据保护条款"
  }
};

// ============================================
// Jurisdiction Knowledge
// ============================================
const JURISDICTION_KNOWLEDGE: Record<string, {
  name: string;
  name_zh: string;
  key_laws: Array<{ name: string; description: string }>;
  risk_focus: string[];
  notes: string[];
}> = {
  us: {
    name: "United States",
    name_zh: "美国",
    key_laws: [
      { name: "Fair Labor Standards Act (FLSA)", description: "Federal minimum wage, overtime, child labor standards" },
      { name: "At-Will Employment Doctrine", description: "Employment can be terminated by either party at any time, with exceptions" },
      { name: "Title VII Civil Rights Act", description: "Prohibits employment discrimination" },
      { name: "ERISA", description: "Employee benefits regulation" }
    ],
    risk_focus: [
      "Minimum wage compliance ($7.25 federal, higher in many states)",
      "Overtime pay (1.5x for hours over 40/week)",
      "Non-compete enforceability varies significantly by state",
      "California: Non-competes generally unenforceable",
      "At-will employment exceptions (implied contract, public policy)"
    ],
    notes: [
      "State laws often provide greater protections than federal law",
      "California, New York, and other states have specific requirements",
      "Arbitration clauses generally enforceable under FAA"
    ]
  },
  eu: {
    name: "European Union",
    name_zh: "欧盟",
    key_laws: [
      { name: "GDPR", description: "General Data Protection Regulation - comprehensive data privacy law" },
      { name: "Working Time Directive", description: "Maximum 48-hour work week, minimum rest periods" },
      { name: "Employee Rights Directive", description: "Information and consultation rights" },
      { name: "Collective Redundancies Directive", description: "Mass layoff procedures" }
    ],
    risk_focus: [
      "GDPR compliance mandatory for any personal data processing",
      "Working hour limits (48 hours/week maximum)",
      "Mandatory notice periods for termination",
      "Works council consultation requirements",
      "Transfer of undertakings protections (TUPE)"
    ],
    notes: [
      "Member states may have stricter requirements",
      "Right to disconnect increasingly recognized",
      "Strong protections against unfair dismissal"
    ]
  },
  cn: {
    name: "China",
    name_zh: "中国",
    key_laws: [
      { name: "Labor Contract Law (劳动合同法)", description: "Core employment law governing contracts" },
      { name: "Social Insurance Law (社会保险法)", description: "Mandatory social insurance contributions" },
      { name: "Employment Promotion Law (就业促进法)", description: "Anti-discrimination, employment services" },
      { name: "Labor Dispute Mediation and Arbitration Law", description: "Dispute resolution procedures" }
    ],
    risk_focus: [
      "Written contract required within 30 days of employment start",
      "Non-compete limited to 2 years maximum",
      "Non-compete compensation required (typically 30% of salary)",
      "Social insurance (五险一金) is mandatory",
      "Probation period limits based on contract term"
    ],
    notes: [
      "Double wages penalty for no written contract",
      "Severance: 1 month salary per year of service",
      "Fixed-term contracts convert to open-ended after two renewals",
      "Local regulations may vary by province/city"
    ]
  },
  uk: {
    name: "United Kingdom",
    name_zh: "英国",
    key_laws: [
      { name: "Employment Rights Act 1996", description: "Core employment rights" },
      { name: "Equality Act 2010", description: "Anti-discrimination protections" },
      { name: "Working Time Regulations", description: "Working hours, rest, and holidays" },
      { name: "UK GDPR", description: "Data protection (post-Brexit version)" }
    ],
    risk_focus: [
      "Statutory minimum notice periods",
      "Unfair dismissal protection after 2 years",
      "Minimum 5.6 weeks paid holiday",
      "National Minimum Wage compliance",
      "Right to request flexible working"
    ],
    notes: [
      "Post-Brexit: EU law no longer directly applicable",
      "Strong tribunal system for employment disputes",
      "Garden leave commonly used in senior roles"
    ]
  }
};

// ============================================
// Contract Completeness Checklist
// ============================================
const COMPLETENESS_CHECKLIST = [
  { id: "parties", name: "Parties Identified", name_zh: "当事人明确", description: "All parties clearly named with addresses/identification" },
  { id: "effective_date", name: "Effective Date", name_zh: "生效日期", description: "Contract start date specified" },
  { id: "term", name: "Term/Duration", name_zh: "期限", description: "Contract period or duration defined" },
  { id: "consideration", name: "Consideration/Compensation", name_zh: "对价/报酬", description: "Payment or exchange clearly stated" },
  { id: "signatures", name: "Signature Blocks", name_zh: "签名栏", description: "Signature blocks present for all parties" },
  { id: "governing_law", name: "Governing Law", name_zh: "适用法律", description: "Applicable law/jurisdiction specified" },
  { id: "dispute_resolution", name: "Dispute Resolution", name_zh: "争议解决", description: "Mechanism for resolving disputes" },
  { id: "termination", name: "Termination Clause", name_zh: "终止条款", description: "Conditions for ending the contract" },
  { id: "confidentiality", name: "Confidentiality", name_zh: "保密条款", description: "Confidentiality provisions if needed" },
  { id: "amendment", name: "Amendment Process", name_zh: "修改程序", description: "Process for modifying the contract" },
  { id: "notices", name: "Notice Provisions", name_zh: "通知条款", description: "How formal notices should be delivered" },
  { id: "force_majeure", name: "Force Majeure", name_zh: "不可抗力", description: "Provisions for unforeseeable circumstances" }
];

// ============================================
// Utility Functions
// ============================================

function detectLanguage(text: string): 'en' | 'zh' | 'mixed' {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
  const totalChars = text.replace(/\s/g, '').length;
  const chineseRatio = chineseChars.length / totalChars;
  
  if (chineseRatio > 0.3) return 'zh';
  if (chineseRatio > 0.1) return 'mixed';
  return 'en';
}

function detectJurisdiction(text: string): string {
  const textLower = text.toLowerCase();
  
  // Check for explicit jurisdiction mentions
  if (textLower.includes('california') || textLower.includes('new york') || 
      textLower.includes('texas') || textLower.includes('united states') ||
      textLower.includes('u.s.') || textLower.includes('usa')) {
    return 'us';
  }
  if (textLower.includes('中华人民共和国') || textLower.includes('中国法律') ||
      textLower.includes('beijing') || textLower.includes('shanghai') ||
      textLower.includes('北京') || textLower.includes('上海')) {
    return 'cn';
  }
  if (textLower.includes('gdpr') || textLower.includes('european union') ||
      textLower.includes('eu law') || textLower.includes('germany') ||
      textLower.includes('france') || textLower.includes('netherlands')) {
    return 'eu';
  }
  if (textLower.includes('united kingdom') || textLower.includes('england') ||
      textLower.includes('wales') || textLower.includes('uk law') ||
      textLower.includes('english law')) {
    return 'uk';
  }
  
  // Default based on language
  const lang = detectLanguage(text);
  if (lang === 'zh') return 'cn';
  return 'us';
}

function scanForRisks(text: string): Array<{
  pattern_id: string;
  pattern: typeof RISK_PATTERNS[string];
  matched_keywords: string[];
  context: string;
}> {
  const results: Array<{
    pattern_id: string;
    pattern: typeof RISK_PATTERNS[string];
    matched_keywords: string[];
    context: string;
  }> = [];
  
  const textLower = text.toLowerCase();
  const sentences = text.split(/[.。!！?？\n]+/);
  
  for (const [patternId, pattern] of Object.entries(RISK_PATTERNS)) {
    const matchedKeywords: string[] = [];
    let contextSentence = '';
    
    // Check English keywords
    for (const keyword of pattern.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        // Find the sentence containing this keyword
        const matchingSentence = sentences.find(s => 
          s.toLowerCase().includes(keyword.toLowerCase())
        );
        if (matchingSentence && !contextSentence) {
          contextSentence = matchingSentence.trim().substring(0, 200);
        }
      }
    }
    
    // Check Chinese keywords
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
        pattern_id: patternId,
        pattern,
        matched_keywords: matchedKeywords,
        context: contextSentence
      });
    }
  }
  
  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => severityOrder[a.pattern.severity] - severityOrder[b.pattern.severity]);
  
  return results;
}

function checkCompleteness(text: string): Array<{
  item: typeof COMPLETENESS_CHECKLIST[number];
  found: boolean;
  evidence?: string;
}> {
  const textLower = text.toLowerCase();
  const results: Array<{
    item: typeof COMPLETENESS_CHECKLIST[number];
    found: boolean;
    evidence?: string;
  }> = [];
  
  const checks: Record<string, { patterns: string[]; patterns_zh: string[] }> = {
    parties: { 
      patterns: ['party', 'parties', 'between', 'employer', 'employee', 'client', 'contractor'],
      patterns_zh: ['甲方', '乙方', '当事人', '雇主', '雇员']
    },
    effective_date: { 
      patterns: ['effective date', 'dated', 'as of', 'commencing on', 'start date'],
      patterns_zh: ['生效日期', '自.*起', '开始日期']
    },
    term: { 
      patterns: ['term', 'duration', 'period', 'expires', 'ending on'],
      patterns_zh: ['期限', '有效期', '合同期']
    },
    consideration: { 
      patterns: ['compensation', 'salary', 'payment', 'fee', 'price', 'consideration', '$', '€', '£'],
      patterns_zh: ['报酬', '薪资', '工资', '费用', '对价', '元', '人民币']
    },
    signatures: { 
      patterns: ['signature', 'signed by', 'authorized representative', 'sign below'],
      patterns_zh: ['签名', '签章', '盖章', '授权代表']
    },
    governing_law: { 
      patterns: ['governing law', 'governed by', 'jurisdiction', 'laws of'],
      patterns_zh: ['适用法律', '管辖', '法律管辖']
    },
    dispute_resolution: { 
      patterns: ['dispute', 'arbitration', 'mediation', 'court', 'litigation'],
      patterns_zh: ['争议', '仲裁', '调解', '诉讼']
    },
    termination: { 
      patterns: ['termination', 'terminate', 'cancellation', 'end of agreement'],
      patterns_zh: ['终止', '解除', '取消']
    },
    confidentiality: { 
      patterns: ['confidential', 'proprietary', 'non-disclosure', 'nda', 'secret'],
      patterns_zh: ['保密', '机密', '秘密']
    },
    amendment: { 
      patterns: ['amendment', 'modify', 'modification', 'change to this agreement'],
      patterns_zh: ['修改', '变更', '修订']
    },
    notices: { 
      patterns: ['notice', 'notification', 'written notice', 'deliver notice'],
      patterns_zh: ['通知', '书面通知']
    },
    force_majeure: { 
      patterns: ['force majeure', 'act of god', 'unforeseeable', 'beyond control'],
      patterns_zh: ['不可抗力', '天灾', '自然灾害']
    }
  };
  
  for (const item of COMPLETENESS_CHECKLIST) {
    const check = checks[item.id];
    let found = false;
    let evidence = '';
    
    if (check) {
      for (const pattern of check.patterns) {
        if (textLower.includes(pattern)) {
          found = true;
          // Extract context
          const idx = textLower.indexOf(pattern);
          evidence = text.substring(Math.max(0, idx - 20), Math.min(text.length, idx + pattern.length + 50)).trim();
          break;
        }
      }
      if (!found) {
        for (const pattern of check.patterns_zh) {
          if (text.includes(pattern) || new RegExp(pattern).test(text)) {
            found = true;
            const idx = text.search(new RegExp(pattern));
            if (idx >= 0) {
              evidence = text.substring(Math.max(0, idx - 10), Math.min(text.length, idx + 40)).trim();
            }
            break;
          }
        }
      }
    }
    
    results.push({ item, found, evidence: found ? evidence : undefined });
  }
  
  return results;
}

// ============================================
// MCP Protocol Implementation
// ============================================

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

const MCP_TOOLS = [
  {
    name: 'scan_contract_risks',
    description: 'Scan contract text for potential risk patterns. Returns matched risks with severity, keywords, and context. Use this as a starting point for deeper analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The contract text to scan'
        }
      },
      required: ['content']
    }
  },
  {
    name: 'check_contract_completeness',
    description: 'Check if a contract contains essential elements (parties, dates, signatures, etc.). Returns a checklist with found/missing items.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The contract text to check'
        }
      },
      required: ['content']
    }
  },
  {
    name: 'get_jurisdiction_knowledge',
    description: 'Get legal knowledge for a specific jurisdiction including key laws, risk focus areas, and notes.',
    inputSchema: {
      type: 'object',
      properties: {
        jurisdiction: {
          type: 'string',
          description: 'Jurisdiction code: us, eu, cn, uk',
          enum: ['us', 'eu', 'cn', 'uk']
        }
      },
      required: ['jurisdiction']
    }
  },
  {
    name: 'detect_contract_context',
    description: 'Analyze contract text to detect language, likely jurisdiction, and contract type.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The contract text to analyze'
        }
      },
      required: ['content']
    }
  },
  {
    name: 'get_risk_pattern_details',
    description: 'Get detailed information about a specific risk pattern including description, keywords to look for, and recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern_id: {
          type: 'string',
          description: 'Risk pattern ID',
          enum: Object.keys(RISK_PATTERNS)
        }
      },
      required: ['pattern_id']
    }
  },
  {
    name: 'list_all_risk_patterns',
    description: 'List all available risk patterns with their IDs, names, and severity levels.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_jurisdictions',
    description: 'List all available jurisdictions with basic information.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

function handleMCPRequest(request: MCPRequest): MCPResponse {
  const { id, method, params } = request;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'contract-review-skill',
              version: '1.0.0',
              description: 'Contract review tools - No API key required. AI analysis is done client-side.'
            }
          }
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: { tools: MCP_TOOLS }
        };

      case 'tools/call': {
        const toolName = params?.name as string;
        const args = params?.arguments as Record<string, unknown>;

        switch (toolName) {
          case 'scan_contract_risks': {
            const content = args.content as string;
            const risks = scanForRisks(content);
            const language = detectLanguage(content);
            
            const formatted = risks.map(r => ({
              risk_id: r.pattern_id,
              name: language === 'zh' ? r.pattern.name_zh : r.pattern.name,
              severity: r.pattern.severity,
              description: language === 'zh' ? r.pattern.description_zh : r.pattern.description,
              matched_keywords: r.matched_keywords,
              context_snippet: r.context,
              recommendation: language === 'zh' ? r.pattern.recommendation_zh : r.pattern.recommendation
            }));

            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    total_risks_found: risks.length,
                    high_severity: risks.filter(r => r.pattern.severity === 'high').length,
                    medium_severity: risks.filter(r => r.pattern.severity === 'medium').length,
                    low_severity: risks.filter(r => r.pattern.severity === 'low').length,
                    risks: formatted,
                    note: 'This is an automated scan. Please review each risk in context and use your judgment.'
                  }, null, 2)
                }]
              }
            };
          }

          case 'check_contract_completeness': {
            const content = args.content as string;
            const results = checkCompleteness(content);
            const language = detectLanguage(content);
            
            const formatted = results.map(r => ({
              element: language === 'zh' ? r.item.name_zh : r.item.name,
              status: r.found ? '✓ Found' : '✗ Missing',
              found: r.found,
              evidence: r.evidence
            }));

            const foundCount = results.filter(r => r.found).length;
            const totalCount = results.length;

            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    completeness_score: `${foundCount}/${totalCount}`,
                    percentage: Math.round((foundCount / totalCount) * 100),
                    checklist: formatted,
                    missing_elements: formatted.filter(f => !f.found).map(f => f.element)
                  }, null, 2)
                }]
              }
            };
          }

          case 'get_jurisdiction_knowledge': {
            const jurisdiction = args.jurisdiction as string;
            const knowledge = JURISDICTION_KNOWLEDGE[jurisdiction];
            
            if (!knowledge) {
              return {
                jsonrpc: '2.0',
                id,
                result: {
                  content: [{
                    type: 'text',
                    text: JSON.stringify({
                      error: `Unknown jurisdiction: ${jurisdiction}`,
                      available: Object.keys(JURISDICTION_KNOWLEDGE)
                    }, null, 2)
                  }]
                }
              };
            }

            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify(knowledge, null, 2)
                }]
              }
            };
          }

          case 'detect_contract_context': {
            const content = args.content as string;
            const language = detectLanguage(content);
            const jurisdiction = detectJurisdiction(content);
            
            // Detect contract type
            const textLower = content.toLowerCase();
            let contractType = 'general';
            if (textLower.includes('employment') || textLower.includes('employee') || 
                content.includes('劳动合同') || content.includes('雇佣')) {
              contractType = 'employment';
            } else if (textLower.includes('non-disclosure') || textLower.includes('nda') ||
                       content.includes('保密协议')) {
              contractType = 'nda';
            } else if (textLower.includes('service agreement') || textLower.includes('services') ||
                       content.includes('服务协议')) {
              contractType = 'service';
            } else if (textLower.includes('lease') || textLower.includes('rental') ||
                       content.includes('租赁')) {
              contractType = 'lease';
            } else if (textLower.includes('purchase') || textLower.includes('sale') ||
                       content.includes('买卖') || content.includes('采购')) {
              contractType = 'purchase';
            }

            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    detected_language: language,
                    likely_jurisdiction: jurisdiction,
                    jurisdiction_name: JURISDICTION_KNOWLEDGE[jurisdiction]?.name || 'Unknown',
                    contract_type: contractType,
                    word_count: content.split(/\s+/).length,
                    recommendation: `Consider using ${jurisdiction.toUpperCase()} jurisdiction knowledge for analysis.`
                  }, null, 2)
                }]
              }
            };
          }

          case 'get_risk_pattern_details': {
            const patternId = args.pattern_id as string;
            const pattern = RISK_PATTERNS[patternId];
            
            if (!pattern) {
              return {
                jsonrpc: '2.0',
                id,
                result: {
                  content: [{
                    type: 'text',
                    text: JSON.stringify({
                      error: `Unknown pattern: ${patternId}`,
                      available: Object.keys(RISK_PATTERNS)
                    }, null, 2)
                  }]
                }
              };
            }

            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    pattern_id: patternId,
                    ...pattern
                  }, null, 2)
                }]
              }
            };
          }

          case 'list_all_risk_patterns': {
            const patterns = Object.entries(RISK_PATTERNS).map(([id, p]) => ({
              id,
              name: p.name,
              name_zh: p.name_zh,
              severity: p.severity
            }));

            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({ patterns }, null, 2)
                }]
              }
            };
          }

          case 'list_jurisdictions': {
            const jurisdictions = Object.entries(JURISDICTION_KNOWLEDGE).map(([code, j]) => ({
              code,
              name: j.name,
              name_zh: j.name_zh,
              key_laws_count: j.key_laws.length
            }));

            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{
                  type: 'text',
                  text: JSON.stringify({ jurisdictions }, null, 2)
                }]
              }
            };
          }

          default:
            return {
              jsonrpc: '2.0',
              id,
              error: { code: -32601, message: `Unknown tool: ${toolName}` }
            };
        }
      }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        };
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      }
    };
  }
}

// ============================================
// HTTP API Handlers (for demo page)
// ============================================

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

async function handleAPIRequest(
  request: Request,
  path: string
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  if (request.method === 'GET' && path === '/api/jurisdictions') {
    const jurisdictions = Object.entries(JURISDICTION_KNOWLEDGE).map(([code, j]) => ({
      code,
      name: j.name,
      name_zh: j.name_zh,
      key_laws: j.key_laws,
      risk_focus: j.risk_focus
    }));
    return Response.json({ jurisdictions }, { headers: corsHeaders() });
  }

  if (request.method === 'GET' && path === '/api/patterns') {
    return Response.json({ patterns: RISK_PATTERNS }, { headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers: corsHeaders() }
    );
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const content = body.content as string;

    if (!content) {
      return Response.json(
        { error: 'Missing content field' },
        { status: 400, headers: corsHeaders() }
      );
    }

    switch (path) {
      case '/api/scan': {
        const risks = scanForRisks(content);
        const language = detectLanguage(content);
        
        return Response.json({
          success: true,
          total_risks: risks.length,
          risks: risks.map(r => ({
            id: r.pattern_id,
            name: language === 'zh' ? r.pattern.name_zh : r.pattern.name,
            severity: r.pattern.severity,
            description: language === 'zh' ? r.pattern.description_zh : r.pattern.description,
            matched_keywords: r.matched_keywords,
            context: r.context,
            recommendation: language === 'zh' ? r.pattern.recommendation_zh : r.pattern.recommendation
          }))
        }, { headers: corsHeaders() });
      }

      case '/api/check': {
        const results = checkCompleteness(content);
        const language = detectLanguage(content);
        
        return Response.json({
          success: true,
          found: results.filter(r => r.found).length,
          total: results.length,
          checklist: results.map(r => ({
            name: language === 'zh' ? r.item.name_zh : r.item.name,
            found: r.found,
            evidence: r.evidence
          }))
        }, { headers: corsHeaders() });
      }

      case '/api/detect': {
        return Response.json({
          success: true,
          language: detectLanguage(content),
          jurisdiction: detectJurisdiction(content)
        }, { headers: corsHeaders() });
      }

      default:
        return Response.json(
          { error: 'Endpoint not found' },
          { status: 404, headers: corsHeaders() }
        );
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// ============================================
// Demo HTML Page
// ============================================

const DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Review Skill - MCP Tools</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .gradient-bg { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
    .card { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); }
  </style>
</head>
<body class="gradient-bg min-h-screen text-white">
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <header class="text-center mb-12">
      <div class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-6">
        <span class="w-2 h-2 bg-emerald-400 rounded-full"></span>
        No API Key Required - Client-Side AI Mode
      </div>
      <h1 class="text-4xl font-bold mb-4">📄 Contract Review Skill</h1>
      <p class="text-slate-400 text-lg">MCP Tools for Claude Desktop & Cursor</p>
      <p class="text-slate-500 mt-2">AI analysis is done by Claude on your device. This server provides tools & knowledge only.</p>
    </header>

    <!-- MCP Config -->
    <section class="card rounded-xl p-8 mb-8">
      <h2 class="text-xl font-bold mb-4">🔧 Connect to Claude Desktop / Cursor</h2>
      <p class="text-slate-400 mb-4">Add this to your MCP configuration:</p>
      <pre class="bg-slate-900 rounded-lg p-4 text-sm overflow-x-auto"><code class="text-emerald-400">{
  "mcpServers": {
    "contract-review": {
      "url": "${typeof location !== 'undefined' ? location.origin : 'https://contract-review-skill.YOUR_SUBDOMAIN.workers.dev'}/mcp"
    }
  }
}</code></pre>
    </section>

    <!-- Available Tools -->
    <section class="card rounded-xl p-8 mb-8">
      <h2 class="text-xl font-bold mb-6">🛠️ Available MCP Tools</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-slate-900/50 rounded-lg p-4">
          <h3 class="font-semibold text-emerald-400 mb-2">scan_contract_risks</h3>
          <p class="text-sm text-slate-400">Scan for 10+ risk patterns with severity levels and recommendations</p>
        </div>
        <div class="bg-slate-900/50 rounded-lg p-4">
          <h3 class="font-semibold text-blue-400 mb-2">check_contract_completeness</h3>
          <p class="text-sm text-slate-400">Check for 12 essential contract elements</p>
        </div>
        <div class="bg-slate-900/50 rounded-lg p-4">
          <h3 class="font-semibold text-purple-400 mb-2">get_jurisdiction_knowledge</h3>
          <p class="text-sm text-slate-400">Get legal knowledge for US, EU, CN, UK jurisdictions</p>
        </div>
        <div class="bg-slate-900/50 rounded-lg p-4">
          <h3 class="font-semibold text-yellow-400 mb-2">detect_contract_context</h3>
          <p class="text-sm text-slate-400">Auto-detect language, jurisdiction, and contract type</p>
        </div>
      </div>
    </section>

    <!-- Quick Test -->
    <section class="card rounded-xl p-8 mb-8">
      <h2 class="text-xl font-bold mb-4">⚡ Quick Test (Rule-Based Scan)</h2>
      <p class="text-slate-400 mb-4">This tests the server's risk scanning - no AI required:</p>
      <textarea 
        id="test-input"
        class="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm mb-4"
        placeholder="Paste contract text here..."
      >Employee agrees to keep all company information confidential in perpetuity. The company may terminate this agreement at any time without cause. Employee agrees not to work for any competitor for 3 years.</textarea>
      <button 
        id="test-btn"
        class="px-6 py-3 bg-emerald-600 rounded-lg font-semibold hover:bg-emerald-500 transition"
      >
        Scan for Risks
      </button>
      <div id="test-output" class="mt-4 bg-slate-900 rounded-lg p-4 text-sm hidden"></div>
    </section>

    <!-- Footer -->
    <footer class="text-center text-slate-500 mt-8">
      <p>Open Source • <a href="https://github.com/claude-office-skills/contract-review-skill" class="text-emerald-400 hover:underline">GitHub</a></p>
    </footer>
  </div>

  <script>
    document.getElementById('test-btn').addEventListener('click', async () => {
      const content = document.getElementById('test-input').value;
      const output = document.getElementById('test-output');
      output.classList.remove('hidden');
      output.innerHTML = '<p class="text-slate-400">Scanning...</p>';
      
      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        const data = await res.json();
        
        if (data.risks && data.risks.length > 0) {
          output.innerHTML = data.risks.map(r => 
            '<div class="mb-3 p-3 bg-slate-800 rounded">' +
            '<span class="' + (r.severity === 'high' ? 'text-red-400' : r.severity === 'medium' ? 'text-yellow-400' : 'text-green-400') + ' font-semibold">' +
            (r.severity === 'high' ? '🔴' : r.severity === 'medium' ? '🟡' : '🟢') + ' ' + r.name + '</span>' +
            '<p class="text-slate-400 text-xs mt-1">' + r.description + '</p>' +
            '<p class="text-slate-500 text-xs mt-1">Keywords: ' + r.matched_keywords.join(', ') + '</p>' +
            '</div>'
          ).join('');
        } else {
          output.innerHTML = '<p class="text-emerald-400">✓ No obvious risks detected by rule-based scan.</p>';
        }
      } catch (e) {
        output.innerHTML = '<p class="text-red-400">Error: ' + e.message + '</p>';
      }
    });
  </script>
</body>
</html>`;

// ============================================
// Main Worker Entry Point
// ============================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle MCP endpoint
    if (path === '/mcp' || path === '/mcp/') {
      if (request.method === 'POST') {
        const mcpRequest = await request.json() as MCPRequest;
        const mcpResponse = handleMCPRequest(mcpRequest);
        return Response.json(mcpResponse, { headers: corsHeaders() });
      }
      return new Response('MCP endpoint - POST only', { status: 405 });
    }

    // Handle API endpoints
    if (path.startsWith('/api/')) {
      return handleAPIRequest(request, path);
    }

    // Serve demo page
    if (path === '/' || path === '/index.html') {
      return new Response(DEMO_HTML, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Health check
    if (path === '/health') {
      return Response.json({
        status: 'ok',
        version: '1.0.0',
        mode: 'client-side-ai',
        note: 'No API key required. AI analysis is done by the MCP client (Claude Desktop/Cursor).',
        tools: MCP_TOOLS.map(t => t.name)
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};
