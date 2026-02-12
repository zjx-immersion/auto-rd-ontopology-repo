# 本体图谱工程平台 - 优化项与需求路线图

**文档版本**: v3.0  
**最后更新**: 2026-02-11  
**状态**: Phase 1完成，Phase 2进行中

---

## 📊 项目现状总结

### 已完成（✅）
| 阶段 | 功能 | 测试覆盖 |
|------|------|----------|
| Phase 1 | Schema Editor + OAG实例化服务 | 37个测试通过 |
| Phase 2-基础 | Excel/CSV导入导出 | 10个测试通过 |

### 累计代码统计
```
后端代码: ~5,000行 (JavaScript/Node.js)
前端代码: ~8,000行 (React)
测试代码: ~4,000行 (Playwright)
API端点: 25个
```

---

## 🔧 第一部分：优化项（Optimization Items）

### 1.1 性能优化 (Performance)

| 优先级 | 优化项 | 现状问题 | 优化方案 | 预估收益 |
|--------|--------|----------|----------|----------|
| P1 | 大图谱懒加载 | 500+节点时卡顿 | 虚拟滚动+分页加载 | 渲染性能提升10x |
| P1 | Cytoscape渲染优化 | 初始化慢 | Web Worker批量计算 | 加载时间-50% |
| P2 | JSON文件存储 → SQLite | 大数据量IO慢 | 关系型数据库存储 | 查询速度+300% |
| P2 | API响应缓存 | 重复查询Schema | Redis缓存层 | 响应时间-70% |
| P3 | 前端代码分割 | bundle体积大 | 懒加载组件 | 首屏加载-40% |

**详细方案 - 大图谱懒加载:**
```javascript
// 虚拟滚动实现
class VirtualGraphRenderer {
  constructor(container, options) {
    this.visibleNodes = new Set();
    this.viewport = { x: 0, y: 0, width: 0, height: 0 };
    this.chunkSize = 100; // 每批加载节点数
  }
  
  // 只渲染视口内的节点
  renderVisibleNodes() {
    const visible = this.nodes.filter(node => 
      this.isInViewport(node.position)
    );
    this.renderBatch(visible);
  }
  
  // 视口变化时动态加载
  onViewportChange(callback) {
    this.viewportObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadChunk(entry.target.dataset.chunkId);
        }
      });
    });
  }
}
```

---

### 1.2 代码质量优化 (Code Quality)

| 优先级 | 优化项 | 现状 | 目标方案 | 工作量 |
|--------|--------|------|----------|--------|
| P1 | 类型系统 | JavaScript无类型 | TypeScript迁移 | 40h |
| P1 | 错误处理 | try-catch不完整 | 统一错误边界 | 16h |
| P2 | 代码复用 | 重复API调用逻辑 | 抽象Service层 | 12h |
| P2 | 测试覆盖率 | 部分模块无测试 | 达到85%覆盖率 | 24h |
| P3 | 文档完善 | API文档缺失 | Swagger自动生成 | 8h |

**TypeScript迁移路径:**
```
Step 1: 后端API层 (16h)
  - 类型定义文件 (types/*.d.ts)
  - Request/Response接口
  
Step 2: 服务层 (16h)
  - Service类类型化
  - 数据库模型类型
  
Step 3: 前端组件 (24h)
  - Props/State类型
  - API调用类型
```

---

### 1.3 安全优化 (Security)

| 优先级 | 优化项 | 风险等级 | 解决方案 | 工作量 |
|--------|--------|----------|----------|--------|
| P0 | 文件上传验证 | 高 | 类型+大小+内容校验 | 4h |
| P0 | API限流 | 中 | Rate Limiting | 4h |
| P1 | 输入XSS过滤 | 中 | DOMPurify | 8h |
| P2 | 权限验证 | 低 | JWT + RBAC | 16h |
| P2 | 数据加密 | 低 | 敏感字段加密 | 8h |

**文件上传安全强化:**
```javascript
// 多层验证
const validateUpload = (file) => {
  // 1. 文件类型白名单
  const allowedTypes = ['.xlsx', '.csv', '.json'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  // 2. MIME类型校验
  if (!file.mimetype.match(/(excel|csv|json)/)) {
    throw new Error('Invalid MIME type');
  }
  
  // 3. 文件头魔数校验
  const magic = file.buffer.slice(0, 4).toString('hex');
  if (!isValidMagicNumber(magic, ext)) {
    throw new Error('File header mismatch');
  }
  
  // 4. 内容扫描
  if (containsMaliciousContent(file.buffer)) {
    throw new Error('Security threat detected');
  }
};
```

---

### 1.4 用户体验优化 (UX)

| 优先级 | 优化项 | 用户痛点 | 解决方案 | 工作量 |
|--------|--------|----------|----------|--------|
| P1 | 加载状态优化 | 白屏等待 | Skeleton屏+进度条 | 8h |
| P1 | 错误提示优化 | 技术错误信息 | 用户友好提示 | 8h |
| P2 | 键盘快捷键 | 无快捷键 | Ctrl+S保存等 | 8h |
| P2 | 撤销重做增强 | 仅Schema Editor支持 | 全局Undo/Redo | 16h |
| P3 | 暗黑模式 | 仅亮色主题 | 主题切换 | 12h |

---

## 📋 第二部分：后续需求列表（Backlog）

### 2.1 Phase 2 剩余需求 (进行中)

#### 2.1.1 数据导入导出增强 ⏳

| 需求ID | 需求描述 | 方案设计 | 验收标准 | 工时 |
|--------|----------|----------|----------|------|
| IE-001 | 批量导入性能优化 | 分片上传+后台队列 | 支持10万行CSV | 16h |
| IE-002 | 导入任务队列 | Bull Queue + Redis | 异步处理大文件 | 12h |
| IE-003 | 导入结果报告 | 详细成功/失败报告 | 可视化报告页面 | 12h |
| IE-004 | 数据映射配置 | 字段映射UI | 拖拽映射字段 | 16h |
| IE-005 | 增量同步 | 定时任务同步 | 支持定时导入 | 12h |

**批量导入架构:**
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   文件上传      │────▶│  分片解析    │────▶│  验证队列   │
│  (前端)         │     │  (Worker)    │     │  (Bull)     │
└─────────────────┘     └──────────────┘     └──────┬──────┘
                                                    │
                       ┌────────────────────────────┘
                       ▼
              ┌─────────────────┐
              │   批量写入DB    │
              │   (事务控制)    │
              └─────────────────┘
```

---

#### 2.1.2 图谱版本控制 📋

| 需求ID | 需求描述 | 方案设计 | 工时 |
|--------|----------|----------|------|
| VC-001 | 版本历史记录 | Git-like版本树 | 16h |
| VC-002 | 版本对比 | 可视化diff | 12h |
| VC-003 | 版本回滚 | 一键回滚 | 8h |
| VC-004 | 分支管理 | 多分支并行编辑 | 20h |
| VC-005 | 变更审计 | 操作日志 | 8h |

**版本控制实现:**
```javascript
class OAGVersionControl {
  async createSnapshot(oagId, comment) {
    const oag = await this.getOAG(oagId);
    const snapshot = {
      id: generateId(),
      parentId: oag.currentVersionId,
      timestamp: new Date(),
      comment,
      data: JSON.stringify(oag),
      hash: calculateHash(oag)
    };
    await this.saveSnapshot(snapshot);
    return snapshot;
  }
  
  async diff(versionId1, versionId2) {
    const v1 = await this.getSnapshot(versionId1);
    const v2 = await this.getSnapshot(versionId2);
    return jsonDiff(v1.data, v2.data);
  }
}
```

---

### 2.2 Phase 3: 图谱Agent助手 (规划中)

#### 2.2.1 Agent架构设计 🎯

```
┌─────────────────────────────────────────────────────────────┐
│                     Agent Core (Python/FastAPI)              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ NLU Engine  │  │ LLM Service │  │ Knowledge Graph     │ │
│  │  - 意图识别 │  │  - GPT-4    │  │  - 向量检索         │ │
│  │  - 实体抽取 │  │  - Claude   │  │  - 路径推理         │ │
│  │  - 关系抽取 │  │  - Local LLM│  │  - 子图匹配         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      Tool Registry                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ SchemaGen│ │ OAGGen   │ │ Validate │ │ Search       │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

#### 2.2.2 Agent能力矩阵

| 能力 | 描述 | 技术方案 | 复杂度 |
|------|------|----------|--------|
| **智能生成** | 从文本生成OAG | LLM + 结构化输出 | 高 |
| **智能验证** | Schema合规检查 | 规则引擎 + LLM | 中 |
| **智能检索** | 自然语言查询 | NL2Cypher/SPARQL | 高 |
| **智能更新** | 增量知识更新 | 变更检测 + 合并 | 高 |
| **智能分析** | 影响分析/推荐 | 图算法 + ML | 高 |
| **API服务** | 外部Agent调用 | RESTful + GraphQL | 中 |

**智能生成实现方案:**
```python
# agent/services/oag_generator.py
class OAGGenerator:
    def __init__(self):
        self.llm = ChatGPT4()
        self.schema_parser = SchemaParser()
    
    async def generate_from_text(self, description: str, schema_id: str):
        # 1. 理解业务描述
        entities = await self.llm.extract_entities(description)
        relations = await self.llm.extract_relations(description)
        
        # 2. 映射到Schema
        schema = await self.get_schema(schema_id)
        mapping = self.schema_parser.map_to_schema(entities, relations, schema)
        
        # 3. 生成OAG
        oag = OAGBuilder()
            .with_schema(schema)
            .with_entities(mapping.entities)
            .with_relations(mapping.relations)
            .build()
        
        return oag
```

---

### 2.3 Phase 4: 高级功能 (长期规划)

#### 2.3.1 SPARQL查询引擎

```
┌────────────────────────────────────────────────────────┐
│                    SPARQL Interface                     │
├────────────────────────────────────────────────────────┤
│  Query Editor ───▶ Parser ───▶ Optimizer ───▶ Executor │
│      │                                               │
│      ▼                                               │
│  Visual Builder ◀──▶ Query Templates                  │
└────────────────────────────────────────────────────────┘
```

**实现步骤:**
1. RDF数据模型转换 (16h)
2. SPARQL解析器 (20h)
3. 查询优化器 (24h)
4. 可视化编辑器 (20h)

---

#### 2.3.2 推理引擎

| 推理类型 | 描述 | 实现方案 |
|----------|------|----------|
| 规则推理 | IF-THEN规则 | Drools/自定义规则引擎 |
| 本体推理 | 类层次推理 | OWL-API/OntoLib |
| 路径推理 | 最短路径/连通性 | NetworkX算法库 |
| 相似性推理 | 实体相似度计算 | 向量相似度(FAISS) |

---

#### 2.3.3 分布式部署

```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ Node 1  │  │ Node 2  │  │ Node 3  │  │ Node N  │    │
│  │ (API)   │  │ (API)   │  │ (API)   │  │ (API)   │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       └─────────────┴─────────────┴─────────────┘        │
│                         │                               │
│                   ┌─────┴─────┐                         │
│                   │  Redis    │                         │
│                   │  Cluster  │                         │
│                   └───────────┘                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 第三部分：方案设计总览

### 3.1 技术选型决策

| 决策项 | 当前方案 | 备选方案 | 推荐选择 |
|--------|----------|----------|----------|
| 数据库 | JSON文件 | SQLite/PostgreSQL | SQLite (Phase 2) |
| 缓存 | 无 | Redis | Redis (Phase 2) |
| 队列 | 无 | Bull/BullMQ | Bull (Phase 2) |
| 类型系统 | JS | TypeScript | TS (持续迁移) |
| Agent LLM | - | GPT-4/Claude | GPT-4 (Phase 3) |
| 向量检索 | - | FAISS/Milvus | FAISS (Phase 3) |

---

### 3.2 实施优先级矩阵

```
                    高影响力
                       ▲
                       │
    ┌──────────────────┼──────────────────┐
    │    立即执行      │     规划执行      │
    │    (Do Now)      │     (Plan)       │
    │                  │                  │
    │  • 性能优化      │  • Agent助手     │
    │  • 安全强化      │  • 推理引擎      │
    │  • 错误处理      │  • SPARQL        │
    │                  │                  │
低努力 ────────────────┼──────────────────▶ 高努力
    │                  │                  │
    │    快速修复      │     考虑延后      │
    │   (Quick Win)    │    (Defer)       │
    │                  │                  │
    │  • UI小优化      │  • 暗黑模式       │
    │  • 文档补充      │  • 分布式部署     │
    │                  │                  │
    └──────────────────┼──────────────────┘
                       │
                       ▼
                    低影响力
```

---

### 3.3 里程碑规划

```
2026 Q1 (1-3月)
├── Phase 2完成
│   ├── 导入导出增强 ✅
│   ├── 版本控制 ⏳
│   └── 性能优化 ⏳
│
2026 Q2 (4-6月)
├── Phase 3启动
│   ├── Agent架构搭建
│   ├── 智能生成
│   └── API服务
│
2026 Q3 (7-9月)
├── Phase 3完成
│   ├── 智能验证
│   ├── 智能检索
│   └── 智能分析
│
2026 Q4 (10-12月)
└── Phase 4启动
    ├── SPARQL查询
    └── 推理引擎
```

---

## 📈 第四部分：预期收益

### 4.1 性能收益

| 优化项 | 当前 | 目标 | 提升 |
|--------|------|------|------|
| 大图谱渲染 | 500节点卡顿 | 10,000节点流畅 | 20x |
| 数据导入 | 1,000行/分 | 100,000行/分 | 100x |
| 查询响应 | 500ms | 50ms | 10x |
| 首屏加载 | 5s | 2s | 2.5x |

### 4.2 功能收益

| 能力 | 用户价值 |
|------|----------|
| Agent助手 | 效率提升80%，降低使用门槛 |
| 版本控制 | 数据安全，协作能力 |
| SPARQL | 专业用户高级查询能力 |
| 推理引擎 | 自动化知识发现 |

---

## 🔗 附录：相关文档

- [Phase 1实施报告](../PROJECT_FULL_ANALYSIS_AND_TODO.md)
- [Schema Editor设计](SCHEMA_EDITOR_DESIGN.md)
- [API文档](./API.md) (待生成)
- [测试报告](../e2e/README.md)
