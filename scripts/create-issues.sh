#!/bin/bash
# GitHub Issue 批量创建脚本
# 使用前请确保已安装 GitHub CLI 并登录: gh auth login

REPO="zjx-immersion/auto-rd-ontopology-repo"

echo "🚀 创建 GitHub Issues..."

# 创建标签
echo "🏷️ 创建标签..."
gh label create "phase-2.5" --color "0052CC" --description "Phase 2.5 优化" --repo ${REPO} 2>/dev/null || true
gh label create "phase-3" --color "5319E7" --description "Phase 3 Agent" --repo ${REPO} 2>/dev/null || true
gh label create "priority-p0" --color "B60205" --description "立即执行" --repo ${REPO} 2>/dev/null || true
gh label create "priority-p3" --color "0E8A16" --description "低优先级" --repo ${REPO} 2>/dev/null || true
gh label create "optimization" --color "FEF2C0" --description "性能优化" --repo ${REPO} 2>/dev/null || true
gh label create "agent" --color "C2E0C6" --description "Agent能力" --repo ${REPO} 2>/dev/null || true
gh label create "ai" --color "D93F0B" --description "AI/LLM" --repo ${REPO} 2>/dev/null || true
gh label create "llm" --color "F9D0C4" --description "LLM集成" --repo ${REPO} 2>/dev/null || true
gh label create "refactor" --color "E99695" --description "代码重构" --repo ${REPO} 2>/dev/null || true
gh label create "code-quality" --color "C5DEF5" --description "代码质量" --repo ${REPO} 2>/dev/null || true

# 创建 Issues
echo "📝 创建 Issues..."

cd /Users/jxzhong/workspace/ontopology-repo/auto-rd-ontopology-repo

# Phase 2.5 优化项
echo "创建 OPT-001..."
gh issue create --repo ${REPO} \
  --title "[OPT-001] 大图谱懒加载优化" \
  --label "optimization,priority-p0,phase-2.5" \
  --body-file .github/issue-templates/OPT-001-lazy-loading.md || echo "Issue可能已存在"

echo "创建 OPT-002..."
gh issue create --repo ${REPO} \
  --title "[OPT-002] TypeScript迁移" \
  --label "refactor,code-quality,priority-p0,phase-2.5" \
  --body-file .github/issue-templates/OPT-002-typescript.md || echo "Issue可能已存在"

echo "创建 OPT-003..."
gh issue create --repo ${REPO} \
  --title "[OPT-003] 统一错误处理" \
  --label "refactor,code-quality,priority-p0,phase-2.5" \
  --body-file .github/issue-templates/OPT-003-error-handling.md || echo "Issue可能已存在"

# Phase 3 Agent
echo "创建 AGENT-001..."
gh issue create --repo ${REPO} \
  --title "[AGENT-001] Agent架构搭建" \
  --label "agent,priority-p0,phase-3" \
  --body-file .github/issue-templates/AGENT-001-architecture.md || echo "Issue可能已存在"

echo "创建 AGENT-002..."
gh issue create --repo ${REPO} \
  --title "[AGENT-002] LLM服务集成(Kimi 2.5)" \
  --label "agent,ai,llm,priority-p0,phase-3" \
  --body-file .github/issue-templates/AGENT-002-llm-kimi.md || echo "Issue可能已存在"

echo "创建 AGENT-003..."
gh issue create --repo ${REPO} \
  --title "[AGENT-003] 智能生成MVP" \
  --label "agent,ai,feature,priority-p0,phase-3" \
  --body "## 目标\n实现基于LLM的智能OAG生成功能\n\n## 功能\n- 文本生成OAG\n- Schema生成\n- 数据实例生成\n\n## 工作量\n32h" || echo "Issue可能已存在"

echo "创建 AGENT-004..."
gh issue create --repo ${REPO} \
  --title "[AGENT-004] 智能检索" \
  --label "agent,ai,search,priority-p0,phase-3" \
  --body "## 目标\n实现自然语言检索图谱功能\n\n## 功能\n- NL转图谱查询\n- 向量检索\n- 混合检索\n\n## 工作量\n32h" || echo "Issue可能已存在"

# 低优先级
echo "创建低优先级任务..."
gh issue create --repo ${REPO} \
  --title "[LOW] 导入导出增强 (延后)" \
  --label "priority-p3" \
  --body "批量导入优化、任务队列 - 延后至Q3\n\n原Phase 2需求，现调整为低优先级" || echo "Issue可能已存在"

gh issue create --repo ${REPO} \
  --title "[LOW] 权限管理 (延后)" \
  --label "priority-p3" \
  --body "RBAC、JWT认证 - 延后至Q3\n\n原Phase 2需求，现调整为低优先级" || echo "Issue可能已存在"

echo ""
echo "✅ Issues 创建完成！"
echo "🔗 访问看板: https://github.com/${REPO}/projects"
