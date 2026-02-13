# 文档清理与归档计划

**日期**: 2026-02-12  
**版本**: v1.0

---

## 📋 当前文档状况

### 统计概览

```
onto-eng-workspace/
├── 根目录文档: 38份
├── phase1/: 3份
├── multi-graph/: 2份  
├── schema-v2/: 7份
├── bugfixes/: 8份
└── archive/: 13份（已归档）

总计: 75份文档，~1015页
```

### 问题识别

1. **文档重复**: Sprint交付文档与PROJECT_STATUS有重叠
2. **过时文档**: 部分Sprint 01/02文档已过时
3. **临时文档**: 根目录存在大量临时总结文档
4. **Bug修复文档**: 分散在bugfixes目录，需要统一索引

---

## 🗂️ 建议目录结构调整

### 新结构

```
onto-eng-workspace/
├── 00-DOCUMENT_INDEX.md          # 文档总索引 ✅
├── 00-START_HERE.md              # 快速开始 ✅
├── README.md                     # 工作空间说明 ✅
│
├── 📁 00-planning/               # 规划文档（新建）
│   ├── 01-REQUIREMENTS.md        # 需求分析
│   ├── 02-USER_STORIES.md        # 用户故事
│   ├── 03-DESIGN_SPEC.md         # 设计规范
│   ├── 04-IMPLEMENTATION_ROADMAP.md  # 实施路线图
│   ├── 05-SPRINT_PLANS.md        # Sprint计划
│   ├── 06-VISUALIZATION_DESIGN.md    # 可视化设计
│   ├── 07-REASONING_DESIGN.md    # 推理设计
│   └── 08-AI_ENHANCEMENT_DESIGN.md   # AI增强设计
│
├── 📁 01-status/                 # 状态文档（新建）
│   ├── PROJECT_STATUS_SUMMARY.md     # 历史状态
│   ├── PROJECT_STATUS_UPDATE_2026-02-12.md  # 当前状态
│   └── NEXT_STEPS.md             # 后续任务
│
├── 📁 02-deliveries/             # 交付文档（新建）
│   ├── phase1/                   # Phase 1交付
│   │   ├── PHASE1_COMPLETED_SUMMARY.md
│   │   ├── PHASE1_PROGRESS_REPORT.md
│   │   └── TASKS_COMPLETED_SUMMARY.md
│   │
│   ├── sprint-01/                # Sprint 01交付
│   │   ├── SPRINT_01_DELIVERY.md
│   │   ├── SPRINT_01_COMPLETED.md
│   │   └── SPRINT_01_REVIEW_AND_ITERATION.md
│   │
│   └── sprint-02/                # Sprint 02交付
│       ├── SPRINT_02_DELIVERY.md
│       ├── SPRINT_02_COMPLETED.md
│       └── SPRINT_02_FINAL_SUMMARY.md
│
├── 📁 03-features/               # 功能文档（新建）
│   ├── SCHEMA_MANAGEMENT_FEATURE.md
│   ├── SCHEMA_QUICK_GUIDE.md
│   ├── MULTI_GRAPH_FEATURE_GUIDE.md
│   ├── MULTI_GRAPH_IMPLEMENTATION_PLAN.md
│   ├── RELATION_TYPE_VISUALIZATION_REDESIGN.md
│   └── RELATION_TYPE_NEW_FEATURES.md
│
├── 📁 04-testing/                # 测试文档（新建）
│   ├── QUICK_TEST_GUIDE.md
│   ├── SPRINT_02_TEST_GUIDE.md
│   ├── TEST_FEEDBACK_SUMMARY.md
│   ├── SMOKE_TEST_REPORT.md
│   └── schema-v2/                # Schema V2测试
│       ├── SCHEMA_V2_TEST_REPORT.md
│       ├── SCHEMA_V2_ALL_COMPLETED.md
│       └── ...
│
├── 📁 05-bugfixes/               # Bug修复文档 ✅ 已有
│   └── ...
│
├── 📁 06-architecture/           # 架构文档（新建）
│   ├── ARCHITECTURE_EVOLUTION_ANALYSIS.md
│   ├── EVOLUTION_EXECUTIVE_SUMMARY.md
│   └── 00-PRIORITY_ADJUSTMENT.md
│
├── 📁 07-operations/             # 运维文档（新建）
│   ├── README_SCRIPTS.md
│   ├── QUICK_TEST_GUIDE.md
│   └── ...
│
├── 📁 08-archive/                # 归档文档 ✅ 已有
│   └── ...
│
└── 📁 schema-v2/                 # Schema V2（保留）
    └── ...（重要文档保留，临时文档归档）
```

---

## 📝 具体清理任务

### 1. 创建新目录结构

```bash
mkdir -p 00-planning 01-status 02-deliveries/sprint-01 02-deliveries/sprint-02 \
         03-features 04-testing 06-architecture 07-operations
```

### 2. 移动文档清单

| 源文件 | 目标位置 | 操作 |
|--------|---------|------|
| 01-REQUIREMENTS.md | 00-planning/ | 移动 |
| 02-USER_STORIES.md | 00-planning/ | 移动 |
| 03-DESIGN_SPEC.md | 00-planning/ | 移动 |
| 04-IMPLEMENTATION_ROADMAP.md | 00-planning/ | 移动 |
| 05-SPRINT_PLANS.md | 00-planning/ | 移动 |
| 06-VISUALIZATION_DESIGN.md | 00-planning/ | 移动 |
| 07-REASONING_DESIGN.md | 00-planning/ | 移动 |
| 08-AI_ENHANCEMENT_DESIGN.md | 00-planning/ | 移动 |
| PROJECT_STATUS_SUMMARY.md | 01-status/ | 移动 |
| PROJECT_STATUS_UPDATE_2026-02-12.md | 01-status/ | 移动 |
| NEXT_STEPS.md | 01-status/ | 移动 |
| SPRINT_01_*.md | 02-deliveries/sprint-01/ | 移动 |
| SPRINT_02_*.md | 02-deliveries/sprint-02/ | 移动 |
| PHASE1_*.md | 02-deliveries/phase1/ | 移动 |
| SCHEMA_MANAGEMENT*.md | 03-features/ | 移动 |
| MULTI_GRAPH*.md | 03-features/ | 移动 |
| RELATION_TYPE*.md | 03-features/ | 移动 |
| *TEST*.md | 04-testing/ | 移动 |
| ARCHITECTURE*.md | 06-architecture/ | 移动 |
| EVOLUTION*.md | 06-architecture/ | 移动 |
| 00-PRIORITY_ADJUSTMENT.md | 06-architecture/ | 移动 |
| README_SCRIPTS.md | 07-operations/ | 移动 |
| QUICK_TEST_GUIDE.md | 07-operations/ | 移动 |

### 3. 更新索引

- [ ] 更新 00-DOCUMENT_INDEX.md 中的所有链接
- [ ] 添加目录说明
- [ ] 更新文档统计

### 4. 删除/归档过时文档

| 文档 | 原因 | 操作 |
|------|------|------|
| SPRINT_01_QUICK_START.md | 已过时 | 归档到 08-archive/ |
| FIXED_AND_VERIFIED.md | 临时文档 | 归档到 08-archive/ |
| STARTUP_SUCCESS.md | 临时文档 | 归档到 08-archive/ |
| PORT_CONFIG_UPDATE.md | 临时文档 | 归档到 08-archive/ |

---

## ✅ 清理后的好处

1. **清晰的结构**: 按阶段/类型组织，易于查找
2. **减少重复**: 合并相似文档，删除过时内容
3. **方便维护**: 新文档有明确的存放位置
4. **降低认知负担**: 新成员更容易理解项目

---

## ⏰ 建议执行时间

- **准备**: 1小时（确认移动清单）
- **执行**: 2小时（实际移动文件）
- **验证**: 1小时（检查链接和索引）
- **总计**: 4小时

---

## 📌 注意事项

1. **保留历史**: 所有文档移动到archive，不删除
2. **更新链接**: 移动后必须更新DOCUMENT_INDEX.md
3. **Git提交**: 使用`git mv`保持历史记录
4. **通知团队**: 清理后通知团队成员新位置

---

**维护者**: AI Assistant  
**建议执行**: 下个Sprint启动前
