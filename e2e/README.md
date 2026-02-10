# E2E测试 - Playwright UI测试

## 测试概述

本目录包含本体图谱工程平台的端到端(E2E) UI测试，使用Playwright框架实现。

## 测试结构

```
e2e/
├── README.md                 # 本文件
├── smoke.spec.js             # 冒烟测试 (TC-01 ~ TC-05)
├── functionality.spec.js     # 功能测试 (TC-06 ~ TC-15)
├── regression.spec.js        # 回归测试 (TC-16 ~ TC-20)
├── fixtures/
│   └── test-helpers.js       # 测试辅助函数
└── data/
    └── test-import.json      # 测试数据
```

## 测试用例覆盖

| 测试文件 | 用例数 | 覆盖功能 |
|----------|--------|----------|
| smoke.spec.js | 5 | 核心流程快速验证 |
| functionality.spec.js | 10 | 详细功能验证 |
| regression.spec.js | 7 | 边界情况和异常处理 |
| **总计** | **22** | **完整功能覆盖** |

## 快速开始

### 1. 安装依赖

```bash
# 在项目根目录执行
npm install

# 安装Playwright浏览器
npx playwright install chromium
```

### 2. 启动服务

```bash
# 方式1: 使用start.sh脚本
./start.sh

# 方式2: 手动启动
npm run start:backend   # 终端1
npm run start:frontend  # 终端2
```

### 3. 执行测试

```bash
# 执行所有测试
npx playwright test

# 执行冒烟测试
npx playwright test smoke.spec.js

# 执行功能测试
npx playwright test functionality.spec.js

# 执行回归测试
npx playwright test regression.spec.js

# UI模式 (可视化调试)
npx playwright test --ui

# 有头模式 (看到浏览器)
npx playwright test --headed

# 调试模式
npx playwright test --debug
```

### 4. 查看报告

```bash
# 查看HTML报告
npx playwright show-report

# 报告路径
./playwright-report/index.html
```

## 测试配置

配置文件: `playwright.config.js`

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| baseURL | http://localhost:8080 | 前端地址 |
| backendURL | http://localhost:8090 | 后端地址 |
| viewport | 1920x1080 | 视口大小 |
| retries | 2 (CI) / 0 (本地) | 失败重试次数 |
| workers | 1 (CI) / undefined | 并行 workers |

## 测试数据

测试使用的数据:
- 智能驾驶图谱 (199节点, 180边)
- 智能座舱图谱 (146节点, 144边)
- 电子电器图谱 (153节点, 153边)

## 测试用例详情

### 冒烟测试 (P0)

| ID | 名称 | 预期时间 |
|----|------|----------|
| TC-01 | 图谱列表页基础显示 | 5s |
| TC-02 | 创建空图谱流程 | 10s |
| TC-03 | 图谱视图基础渲染 | 10s |
| TC-04 | 点击节点查看详情 | 8s |
| TC-05 | 视图切换功能 | 15s |

**总计**: ~48秒

### 功能测试 (P1)

| ID | 名称 | 预期时间 |
|----|------|----------|
| TC-06 | 表格视图搜索功能 | 10s |
| TC-07 | 表格视图分页功能 | 8s |
| TC-08 | 矩阵视图渲染 | 8s |
| TC-09 | 树形视图展开折叠 | 8s |
| TC-10 | 仪表盘统计显示 | 8s |
| TC-11 | Schema查看器 | 8s |
| TC-12 | JSON数据导入 | 15s |
| TC-13 | 图谱导出功能 | 10s |
| TC-14 | 全局节点搜索 | 8s |
| TC-15 | 图谱删除流程 | 15s |

**总计**: ~98秒

### 回归测试 (P2)

| ID | 名称 | 预期时间 |
|----|------|----------|
| TC-16 | 响应式布局 | 10s |
| TC-17 | 网络异常处理 | 8s |
| TC-18 | 大图谱加载性能 | 15s |
| TC-19 | 多图谱切换 | 12s |
| TC-20 | 右键菜单功能 | 8s |

**总计**: ~53秒

## 测试用例设计文档

详细测试用例设计请查看:
[UI_TEST_CASES.md](../temp_workspace/UI_TEST_CASES.md)

## 持续集成

### GitHub Actions配置

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright
      run: npx playwright install --with-deps chromium
    - name: Run Playwright tests
      run: npx playwright test
    - name: Upload report
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: playwright-report/
```

## 常见问题

### Q1: 测试失败，提示页面未加载

确保前后端服务已启动:
```bash
curl http://localhost:8090/health  # 检查后端
curl http://localhost:8080         # 检查前端
```

### Q2: 浏览器无法启动

安装浏览器依赖:
```bash
npx playwright install-deps chromium
```

### Q3: 测试超时

增加超时时间:
```bash
npx playwright test --timeout=60000
```

### Q4: 如何调试测试

使用UI模式:
```bash
npx playwright test --ui
```

或在代码中添加断点:
```javascript
await page.pause();  // 测试会在此暂停
```

## 维护指南

### 添加新测试

1. 在对应spec文件中添加测试用例
2. 使用`test.describe`分组
3. 使用辅助函数简化代码
4. 添加清晰的注释和日志

### 更新选择器

当UI变更时，更新选择器:
```javascript
// 使用稳定的选择器
page.locator('[data-testid="graph-view"]')  // 推荐
page.locator('#cy')                          // 次选
page.locator('.cytoscape-container')         // 备选
```

### 测试数据管理

测试数据存放在 `e2e/data/` 目录:
- `test-import.json` - 导入测试数据
- 新增数据文件请在 `cleanupTestGraphs` 中添加清理逻辑

## 联系方式

如有问题，请联系:
- 测试负责人: [待填写]
- 开发团队: [待填写]
