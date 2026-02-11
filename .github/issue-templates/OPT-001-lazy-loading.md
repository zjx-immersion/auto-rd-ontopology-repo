# OPT-001: 大图谱懒加载优化

## 优化目标
解决500+节点图谱渲染卡顿问题，支持10,000+节点流畅渲染。

## 当前瓶颈
- Cytoscape一次性渲染所有节点
- 初始化时间随节点数指数增长
- 内存占用过高导致浏览器卡顿

## 优化方案

### 1. 虚拟滚动实现
```javascript
class VirtualGraphRenderer {
  constructor(container, options) {
    this.visibleNodes = new Set();
    this.viewport = { x: 0, y: 0, width: 0, height: 0 };
    this.chunkSize = 100;
    this.renderBuffer = 50; // 视口外预渲染节点数
  }
  
  // 计算视口内节点
  getVisibleNodes() {
    return this.allNodes.filter(node => {
      const pos = node.position;
      return pos.x >= this.viewport.x - this.renderBuffer &&
             pos.x <= this.viewport.x + this.viewport.width + this.renderBuffer &&
             pos.y >= this.viewport.y - this.renderBuffer &&
             pos.y <= this.viewport.y + this.viewport.height + this.renderBuffer;
    });
  }
  
  // 分批渲染
  renderBatch(nodes) {
    const batches = chunk(nodes, this.chunkSize);
    batches.forEach((batch, index) => {
      setTimeout(() => {
        this.cy.add(batch);
      }, index * 16); // 每帧渲染一批
    });
  }
}
```

### 2. 视口监听
```javascript
// 监听画布平移和缩放
cy.on('viewport', () => {
  const extent = cy.extent();
  renderer.updateViewport(extent);
  renderer.renderVisibleNodes();
});
```

### 3. 分层渲染
- 第一层：视口内节点（高质量渲染）
- 第二层：视口外缓存区节点（简化渲染）
- 第三层：远距离节点（不渲染，只保留数据）

## 预期收益
| 指标 | 当前 | 目标 | 提升 |
|------|------|------|------|
| 渲染时间(1000节点) | 5s | 0.5s | 10x |
| 内存占用 | 500MB | 100MB | 5x |
| 流畅节点数 | 500 | 10,000 | 20x |

## 工作量估算
- **总工时**: 16h
- **前端开发**: 12h
- **测试验证**: 4h

## 验收标准
- [ ] 1000节点图谱初始化时间 < 1s
- [ ] 10,000节点图谱可流畅缩放和平移
- [ ] 内存占用 < 200MB
- [ ] Playwright性能测试通过

## 相关文件
- `frontend/src/components/GraphVisualization/`
- `frontend/src/utils/virtualRenderer.js` (新建)

## 依赖
- 无

## 风险
- 与现有Cytoscape插件兼容性需要验证
