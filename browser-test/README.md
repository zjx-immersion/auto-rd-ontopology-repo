# Browser Test 目录

本目录包含项目的端到端 (E2E) 测试和浏览器自动化测试。

## 目录结构

```
browser-test/
├── e2e/                    # E2E 测试用例
│   ├── smoke.spec.js       # 冒烟测试
│   ├── functionality.spec.js   # 功能测试
│   ├── schema-editor.spec.js   # Schema Editor 测试
│   └── ...
├── fixtures/               # 测试数据和辅助函数
├── reports/                # 测试报告
│   ├── playwright-report/  # HTML 报告
│   └── test-results/       # 测试结果
├── playwright.config.js    # Playwright 配置
└── package.json            # 测试依赖
```

## 安装依赖

```bash
cd browser-test
npm install
```

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npx playwright test smoke.spec.js

# 以 UI 模式运行
npx playwright test --ui

# 生成报告
npx playwright show-report reports/playwright-report
```

## 配置说明

- **Base URL**: http://localhost:6060 (前端)
- **API URL**: http://localhost:3001 (后端)
- **默认浏览器**: Chromium
- **视口**: 1920x1080

## 测试分类

1. **Smoke Tests** - 基础功能冒烟测试
2. **Functionality Tests** - 核心功能测试
3. **Schema Editor Tests** - Schema 编辑器专项测试
4. **API Tests** - 后端 API 集成测试
5. **Import/Export Tests** - 导入导出功能测试
