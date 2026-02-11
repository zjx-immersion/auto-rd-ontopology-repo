# GitHub Project 配置指南

## 项目看板名称
**本体图谱工程平台 Roadmap 2026**

## 看板结构

### 📋 Views (视图)

1. **Roadmap (路线图)** - 按季度分组
2. **Sprint Planning (迭代规划)** - 按状态分组
3. **Team Workload (团队负载)** - 按负责人分组
4. **Priority View (优先级视图)** - 按优先级分组

---

## 🏷️ 标签体系

### 类型标签 (Type)
- `optimization` - 性能优化
- `feature` - 新功能
- `agent` - Agent能力
- `bug` - 缺陷修复
- `refactor` - 代码重构
- `test` - 测试相关
- `docs` - 文档

### 优先级标签 (Priority)
- `priority-p0` - 立即执行 (本周)
- `priority-p1` - 高优先级 (本月)
- `priority-p2` - 中优先级 (下月)
- `priority-p3` - 低优先级 (后续)

### 阶段标签 (Phase)
- `phase-2.5` - Phase 2.5 优化
- `phase-3` - Phase 3 Agent
- `phase-4` - Phase 4 高级功能

### 状态标签 (Status)
- `todo` - 待开始
- `in-progress` - 进行中
- `review` - 代码审查
- `testing` - 测试中
- `done` - 已完成

### 模块标签 (Module)
- `backend` - 后端
- `frontend` - 前端
- `api` - API接口
- `test` - 测试
- `docs` - 文档

---

## 📊 看板列 (Board Columns)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│  📋     │  🏃     │  👀     │  🧪     │  ✅     │  🗃️     │
│ Backlog │ In      │ In      │ Testing │ Done    │ Archive │
│         │ Progress│ Review  │         │         │         │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## 🎯 Issue 列表

### Phase 2.5: 立即执行优化

#### OPT-001: 大图谱懒加载优化
- **标签**: `optimization`, `performance`, `frontend`, `priority-p0`, `phase-2.5`
- **负责人**: @jxzhong
- **工时**: 16h
- **里程碑**: 2026-02-28
- **描述**: 
  - 实现虚拟滚动渲染
  - 视口外节点懒加载
  - 支持10,000+节点流畅渲染

#### OPT-002: TypeScript迁移
- **标签**: `refactor`, `code-quality`, `backend`, `frontend`, `priority-p0`, `phase-2.5`
- **负责人**: @jxzhong
- **工时**: 40h
- **里程碑**: 2026-03-15
- **描述**:
  - 后端API层类型定义
  - Service层类型化
  - 前端组件Props/State类型

#### OPT-003: 统一错误处理
- **标签**: `refactor`, `code-quality`, `backend`, `frontend`, `priority-p0`, `phase-2.5`
- **负责人**: @jxzhong
- **工时**: 8h
- **里程碑**: 2026-02-21
- **描述**:
  - 全局错误边界
  - 统一错误响应格式
  - 用户友好错误提示

---

### Phase 3: Agent助手 (高优先级)

#### AGENT-001: Agent架构搭建
- **标签**: `agent`, `ai`, `architecture`, `backend`, `priority-p0`, `phase-3`
- **负责人**: @jxzhong
- **工时**: 40h
- **里程碑**: 2026-04-15
- **描述**:
  - Python/FastAPI服务搭建
  - NLU Engine集成
  - Tool Registry设计

#### AGENT-002: LLM服务集成 (Kimi 2.5)
- **标签**: `agent`, `ai`, `llm`, `backend`, `priority-p0`, `phase-3`
- **负责人**: @jxzhong
- **工时**: 24h
- **里程碑**: 2026-04-30
- **描述**:
  - Kimi 2.5 API接入
  - 提示词工程
  - 流式响应处理

#### AGENT-003: 智能生成MVP
- **标签**: `agent`, `ai`, `feature`, `backend`, `frontend`, `priority-p0`, `phase-3`
- **负责人**: @jxzhong
- **工时**: 32h
- **里程碑**: 2026-05-15
- **描述**:
  - 文本生成OAG
  - Schema生成
  - 数据实例生成

#### AGENT-004: 智能检索
- **标签**: `agent`, `ai`, `search`, `backend`, `priority-p0`, `phase-3`
- **负责人**: @jxzhong
- **工时**: 32h
- **里程碑**: 2026-05-30
- **描述**:
  - 自然语言转图谱查询
  - 向量检索(FAISS)
  - 混合检索策略

---

### Phase 2: 低优先级

#### P2-LOW-001: 导入导出增强 (低优先级)
- **标签**: `feature`, `import-export`, `backend`, `priority-p3`, `phase-2`
- **负责人**: @jxzhong
- **工时**: 68h
- **里程碑**: 2026-Q3
- **描述**:
  - 批量导入性能优化
  - 导入任务队列
  - 数据映射配置

#### P2-LOW-002: 权限管理 (低优先级)
- **标签**: `feature`, `security`, `backend`, `priority-p3`, `phase-2`
- **负责人**: @jxzhong
- **工时**: 48h
- **里程碑**: 2026-Q3
- **描述**:
  - RBAC权限模型
  - JWT认证
  - 数据权限控制

---

## 🔄 自动化工作流

### Issue 自动标签
```yaml
# .github/workflows/issue-auto-label.yml
on:
  issues:
    types: [opened, edited]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v4
        with:
          configuration-path: .github/labeler.yml
```

### PR 自动关联
```yaml
# 当PR包含 "fixes #123" 时自动移动issue到In Review
```

---

## 📈 度量指标

### 团队度量
- Cycle Time (周期时间)
- Throughput (吞吐量)
- Work In Progress (在制品数量)

### 项目度量
- Bug Escape Rate (缺陷逃逸率)
- Code Coverage (代码覆盖率)
- Deploy Frequency (部署频率)

---

## 🚀 快速开始

### 创建Issue命令
```bash
# 使用GitHub CLI创建issue
gh issue create \
  --title "[OPT-001] 大图谱懒加载优化" \
  --label "optimization,performance,priority-p0" \
  --milestone "Phase 2.5" \
  --body-file .github/issue-templates/opt-001.md
```

### 批量创建脚本
```bash
# 创建所有Phase 2.5优化项
for issue in opt-001 opt-002 opt-003; do
  gh issue create --template optimization --title "[$issue]"
done
```
