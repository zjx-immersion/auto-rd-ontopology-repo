# 快速启动指南

5分钟快速启动本体图谱工程平台。

## 前置要求

- Node.js >= 16.x
- npm >= 8.x
- 现代浏览器（Chrome、Firefox、Safari、Edge）

## 第一步：安装依赖

```bash
# 进入项目根目录
cd auto-rd-ontopology-repo

# 安装所有依赖（根目录、前端、后端）
npm run install:all

# 或者分别安装
cd backend && npm install
cd ../frontend && npm install
```

## 第二步：启动后端服务

```bash
# 在backend目录下
cd backend
npm start

# 或者使用开发模式（支持热重载）
npm run dev
```

看到以下输出说明后端启动成功：

```
╔═══════════════════════════════════════════════════════╗
║   本体图谱工程平台 - 后端服务                         ║
║   版本: 0.1.0                                         ║
║   端口: 3001                                          ║
╚═══════════════════════════════════════════════════════╝
✅ 服务已启动
✅ Schema加载成功
✅ 数据加载成功: 22个节点, 22条边
```

## 第三步：启动前端应用

在新的终端窗口中：

```bash
# 在frontend目录下
cd frontend
npm start
```

浏览器会自动打开 `http://localhost:3000`

## 第四步：查看效果

访问 `http://localhost:3000`，你应该能看到：

1. ✅ **顶部导航栏**：显示系统标题和操作按钮
2. ✅ **左侧边栏**：显示统计信息和实体类型
3. ✅ **中间画布**：可视化的知识图谱
4. ✅ **22个节点**：不同颜色代表不同实体类型
5. ✅ **22条关系边**：带箭头的有向边

## 第五步：交互体验

### 查看节点详情
- 点击任意节点，右侧弹出详情面板
- 显示节点的所有属性信息

### 执行追溯查询
1. 点击一个软件需求节点（如 SWR_5001）
2. 在详情面板中选择"完整追溯"
3. 设置追溯深度为 3
4. 点击"执行追溯查询"
5. 查看上游链路和下游影响

### 导入新数据
1. 点击顶部"导入数据"按钮
2. 选择"Markdown表格"标签
3. 复制 `data/sample-triples.md` 中的表格
4. 粘贴并导入

## 并发启动（推荐）

在项目根目录下，一次性启动前后端：

```bash
# 安装concurrently（如果未安装）
npm install

# 同时启动前后端
npm start
```

## 验证安装

### 测试后端API

```bash
# 健康检查
curl http://localhost:3001/health

# 获取图谱数据
curl http://localhost:3001/api/v1/graph/data

# 执行追溯查询
curl -X POST http://localhost:3001/api/v1/ontology/trace \
  -H "Content-Type: application/json" \
  -d '{"entity_id":"SWR_5001","query_type":"full_trace"}'
```

### 测试前端应用

访问以下URL：
- 主页: http://localhost:3000
- 开发者工具控制台无报错

## 常见问题

### 端口被占用

**问题**: Error: listen EADDRINUSE: address already in use :::3001

**解决**:
```bash
# 查找占用端口的进程
lsof -i :3001
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者修改端口
# backend: 修改 src/server.js 中的 PORT
# frontend: 在 package.json 中添加 "start": "PORT=3002 react-scripts start"
```

### 依赖安装失败

**问题**: npm install 报错

**解决**:
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 前端连接后端失败

**问题**: API请求失败，跨域错误

**解决**:
1. 确认后端已启动并在3001端口运行
2. 检查 `frontend/package.json` 中的 `proxy` 配置
3. 清除浏览器缓存并刷新

### 图谱不显示

**问题**: 页面空白，图谱未渲染

**解决**:
1. 打开浏览器开发者工具查看Console错误
2. 确认数据已加载（检查Network标签）
3. 尝试刷新页面

## 下一步

- 📖 阅读 [API文档](./API.md) 了解接口详情
- 📊 导入更多样本数据（见 `data/sample-triples.md`）
- 🔧 自定义本体模型（编辑 `data/schema.json`）
- 🚀 部署到生产环境

## 技术支持

遇到问题？
- 查看项目 README.md
- 检查 GitHub Issues
- 联系开发团队
