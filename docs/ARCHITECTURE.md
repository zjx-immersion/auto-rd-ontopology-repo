# 系统架构文档

本体图谱工程平台 - 技术架构说明

## 系统概览

```
┌─────────────────────────────────────────────────────────────┐
│                       前端层 (Frontend)                      │
│  React 18 + Ant Design 5 + Cytoscape.js                    │
│  ┌──────────┬──────────┬──────────┬──────────────────┐     │
│  │  Header  │ Sidebar  │GraphView │  Detail Panels   │     │
│  └──────────┴──────────┴──────────┴──────────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
                         │ (JSON)
┌────────────────────────▼────────────────────────────────────┐
│                       后端层 (Backend)                       │
│  Node.js + Express.js                                       │
│  ┌─────────────────┬──────────────────┬──────────────────┐ │
│  │   Routes 层     │   Services 层    │   Parsers 层     │ │
│  ├─────────────────┼──────────────────┼──────────────────┤ │
│  │ /graph/*        │ GraphService     │ MarkdownParser   │ │
│  │ /ontology/*     │ TraceService     │ ExcelParser      │ │
│  │ /import/*       │                  │                  │ │
│  └─────────────────┴──────────────────┴──────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ File I/O
┌────────────────────────▼────────────────────────────────────┐
│                      数据层 (Data)                           │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ schema.json  │sample-data.json│  sample-triples.md │    │
│  │ (本体模型)   │ (图谱数据)   │   (导入样本)         │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 技术栈

### 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI框架 |
| Ant Design | 5.12.5 | UI组件库 |
| Cytoscape.js | 3.28.1 | 图可视化引擎 |
| Cytoscape-dagre | 2.5.0 | 图布局算法 |
| Axios | 1.6.5 | HTTP客户端 |
| XLSX | 0.18.5 | Excel解析 |

### 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | >=16.x | 运行环境 |
| Express | 4.18.2 | Web框架 |
| CORS | 2.8.5 | 跨域支持 |
| Body-parser | 1.20.2 | 请求解析 |
| XLSX | 0.18.5 | Excel处理 |

## 核心模块设计

### 1. GraphService（图数据服务）

**职责**：管理知识图谱的核心数据（节点和边）

**核心方法**：
```javascript
class GraphService {
  loadData()              // 从文件加载数据
  saveData()              // 持久化数据到文件
  getNodes(filter)        // 获取节点（支持过滤）
  getNodeById(id)         // 根据ID获取节点
  addNode(node)           // 添加节点
  updateNode(id, updates) // 更新节点
  deleteNode(id)          // 删除节点
  getEdges(filter)        // 获取边（支持过滤）
  addEdge(edge)           // 添加边
  deleteEdge(id)          // 删除边
  searchNodes(keyword)    // 搜索节点
  importData(nodes, edges)// 批量导入
  getStatistics()         // 获取统计信息
}
```

**数据结构**：
```javascript
// 节点结构
{
  id: "SWR_5001",
  type: "SWR",
  data: {
    title: "OD模型训练精度提升至96%",
    owner: "张三",
    status: "开发中",
    // ... 其他属性
  }
}

// 边结构
{
  id: "e1",
  source: "SYS_2001",
  target: "SWR_5001",
  type: "decomposes_to",
  data: {
    confidence: 1.0,
    source_system: "玄武平台"
  }
}
```

### 2. TraceService（追溯服务）

**职责**：实现需求追溯和影响分析算法

**核心方法**：
```javascript
class TraceService {
  trace(entityId, queryType, depth)     // 主追溯方法
  getUpstreamChain(entityId, maxDepth)  // 向上追溯
  getDownstreamChain(entityId, maxDepth)// 向下追溯
  getTestCoverage(entityId)             // 测试覆盖分析
  analyzeChangeImpact(entityId)         // 变更影响分析
  getFullPath(entityId)                 // 获取完整路径
}
```

**追溯算法**：
```javascript
// 深度优先遍历（DFS）
function traverse(nodeId, level) {
  if (level > maxDepth || visited.has(nodeId)) return;
  
  visited.add(nodeId);
  const neighbors = getNeighbors(nodeId);
  
  neighbors.forEach(neighbor => {
    chain.push({ level, node: neighbor });
    traverse(neighbor.id, level + 1);
  });
}
```

### 3. MarkdownParser & ExcelParser（数据解析器）

**职责**：解析Markdown表格和Excel文件，转换为图谱数据

**解析流程**：
```
输入数据 (Markdown/Excel)
    ↓
提取表格行
    ↓
解析实体ID（正则匹配）
    ↓
推断实体类型（基于ID前缀）
    ↓
构建节点和边
    ↓
返回标准化数据结构
```

**ID识别正则**：
```javascript
// 支持格式：
// 1. "PROJ_001"
// 2. "车型项目: PROJ_001"
// 3. "车型项目 (PROJ_001)"

const patterns = [
  /^(.+?)[:：]\s*([A-Z_0-9]+)$/,      // 格式2
  /^([A-Z_0-9]+)$/,                   // 格式1
  /^(.+?)\s*[\(（]([A-Z_0-9]+)[\)）]$/ // 格式3
];
```

### 4. GraphView（图可视化组件）

**职责**：使用Cytoscape.js渲染交互式知识图谱

**渲染流程**：
```javascript
useEffect(() => {
  // 1. 初始化Cytoscape实例
  const cy = cytoscape({
    container: containerRef.current,
    elements: formatGraphData(data, schema),
    style: getGraphStyle(schema),
    layout: { name: 'dagre' }
  });

  // 2. 绑定事件
  cy.on('tap', 'node', handleNodeClick);
  cy.on('tap', handleBackgroundClick);

  // 3. 清理
  return () => cy.destroy();
}, [data]);
```

**布局算法**：使用 Dagre 分层布局
- 方向：从上到下（TB）
- 节点间距：50px
- 层级间距：100px

**样式配置**：
- 节点：圆形，60x60px，根据实体类型着色
- 边：贝塞尔曲线，箭头指向目标
- 高亮：选中节点加粗边框，相连边变蓝

## 数据流设计

### 查询数据流
```
用户操作 (前端)
    ↓
API请求 (axios)
    ↓
路由分发 (Express Router)
    ↓
业务逻辑 (Service)
    ↓
数据访问 (GraphService)
    ↓
返回结果 (JSON)
    ↓
前端渲染 (React)
```

### 追溯查询流程
```
用户点击节点
    ↓
选择追溯类型（full_trace/impact_analysis/downstream_tasks）
    ↓
调用 POST /api/v1/ontology/trace
    ↓
TraceService.trace(entityId, queryType, depth)
    ↓
├─ getUpstreamChain() → DFS向上遍历
├─ getDownstreamChain() → DFS向下遍历
├─ getTestCoverage() → 查找测试用例和问题
└─ analyzeChangeImpact() → 评估影响范围
    ↓
组装结果对象
    ↓
返回前端显示（TraceResultPanel）
```

### 数据导入流程
```
用户上传文件/粘贴文本
    ↓
前端解析（Excel用XLSX库）
    ↓
调用 POST /api/v1/import/markdown 或 /excel
    ↓
后端解析器（MarkdownParser/ExcelParser）
    ↓
├─ 解析表格行
├─ 提取实体ID
├─ 推断实体类型
└─ 构建节点和边
    ↓
GraphService.importData(nodes, edges)
    ↓
├─ 验证数据格式
├─ 去重（基于ID）
├─ 合并到现有数据
└─ 持久化到文件
    ↓
返回导入结果统计
    ↓
前端刷新图谱
```

## 性能优化策略

### 1. 前端优化
- **虚拟化渲染**：大规模图谱时使用Cytoscape的视口裁剪
- **延迟加载**：初始只加载核心数据，按需加载详情
- **缓存策略**：Schema数据本地缓存，减少重复请求
- **防抖搜索**：搜索输入使用300ms防抖

### 2. 后端优化
- **内存图索引**：使用Map数据结构加速节点查询（O(1)复杂度）
- **追溯剪枝**：使用visited集合避免循环依赖
- **批量操作**：支持批量导入和批量查询
- **响应压缩**：启用gzip压缩大型JSON响应

### 3. 数据优化
- **增量同步**：支持增量导入，避免全量重建
- **数据分片**：超大规模时可按项目分片存储
- **索引优化**：关键字段（ID、type）建立索引

## 可扩展性设计

### 1. 支持Neo4j图数据库
```javascript
// 替换GraphService的存储实现
class Neo4jGraphService extends GraphService {
  async getNodes(filter) {
    const session = driver.session();
    const result = await session.run(
      'MATCH (n:Node) WHERE n.type = $type RETURN n',
      { type: filter.type }
    );
    return result.records.map(r => r.get('n').properties);
  }
  // ... 其他方法
}
```

### 2. 插件化解析器
```javascript
// 支持自定义数据源
class CustomParser extends BaseParser {
  parse(data) {
    // 自定义解析逻辑
    return { nodes, edges };
  }
}

// 注册解析器
ParserRegistry.register('custom', CustomParser);
```

### 3. 扩展本体模型
编辑 `data/schema.json` 添加新的实体类型：
```json
{
  "entityTypes": {
    "NewEntityType": {
      "code": "CLS_11",
      "label": "新实体类型",
      "properties": { ... },
      "color": "#ff6b6b"
    }
  }
}
```

### 4. 集成外部系统
- **飞书/钉钉**：通过Webhook推送追溯结果
- **GitLab CI/CD**：自动更新代码提交节点
- **Jira/Confluence**：双向同步需求和问题
- **Prometheus**：暴露监控指标

## 安全性设计

### 当前版本（开发环境）
- ⚠️ 无认证机制
- ⚠️ 无权限控制
- ⚠️ 无数据加密

### 生产环境建议
1. **认证**：实现JWT或OAuth2
2. **授权**：基于角色的访问控制(RBAC)
3. **审计**：记录所有数据变更操作
4. **限流**：防止API滥用
5. **HTTPS**：加密传输层
6. **输入验证**：防止SQL注入和XSS攻击

## 部署架构

### 开发环境
```
localhost:3000 (前端)
    ↓
localhost:3001 (后端)
    ↓
data/*.json (文件存储)
```

### 生产环境（推荐）
```
┌─────────────┐
│  Nginx      │ (负载均衡、HTTPS)
│  80/443     │
└──────┬──────┘
       ↓
┌──────────────────────────┐
│  Frontend (静态托管)      │
│  CDN / OSS               │
└──────┬───────────────────┘
       ↓ API请求
┌──────────────────────────┐
│  Backend Cluster         │
│  Node.js x N (PM2管理)   │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│  Neo4j / MongoDB         │
│  图数据库集群             │
└──────────────────────────┘
```

### Docker部署
```dockerfile
# Dockerfile (后端)
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

## 监控与运维

### 关键指标
- **QPS**：每秒查询数
- **响应时间**：P50/P95/P99
- **错误率**：5xx错误占比
- **数据规模**：节点数、边数、文件大小

### 日志策略
```javascript
// 结构化日志
logger.info('Graph query', {
  operation: 'getNodes',
  filter: { type: 'SWR' },
  duration: 45,
  result_count: 3
});
```

### 健康检查
```bash
# 健康检查端点
curl http://localhost:3001/health

# 返回
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

## 技术债务与改进方向

### 当前限制
1. ❌ 数据存储在JSON文件，不支持高并发
2. ❌ 追溯算法未优化，大规模图谱性能下降
3. ❌ 前端未实现虚拟滚动，节点过多卡顿
4. ❌ 无实时协作功能

### 改进计划
- [ ] 集成Neo4j图数据库
- [ ] 实现WebSocket实时推送
- [ ] 添加历史版本管理（时序图谱）
- [ ] 支持图谱导出（GraphML、Gephi格式）
- [ ] 实现AI驱动的关系推荐

## 参考资料

- [Cytoscape.js文档](https://js.cytoscape.org/)
- [Ant Design组件库](https://ant.design/)
- [Express.js指南](https://expressjs.com/)
- [Neo4j图数据库](https://neo4j.com/)
- [本体建模最佳实践](https://www.w3.org/TR/owl2-primer/)
