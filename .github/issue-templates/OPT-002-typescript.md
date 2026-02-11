# OPT-002: TypeScript迁移

## 目标
将项目从JavaScript迁移到TypeScript，提升代码质量和开发效率。

## 迁移范围

### 第一阶段：后端API层 (16h)
```
backend/src/routes/*.js → .ts
backend/src/services/*.js → .ts
```

**类型定义文件结构:**
```
backend/src/types/
├── index.ts          # 统一导出
├── entity.ts         # 实体类型
├── relation.ts       # 关系类型
├── schema.ts         # Schema定义
├── oag.ts            # OAG类型
└── api.ts            # API请求/响应
```

**示例类型定义:**
```typescript
// types/entity.ts
export interface Entity {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityType {
  code: string;
  label: string;
  description?: string;
  properties: PropertyDefinition[];
  color: string;
}
```

### 第二阶段：前端组件 (24h)
```
frontend/src/components/*.js → .tsx
frontend/src/pages/*.js → .tsx
frontend/src/services/*.js → .ts
```

**组件类型示例:**
```typescript
// components/SchemaEditor/index.tsx
import React from 'react';
import { EntityType, RelationType } from '../../types';

interface SchemaEditorProps {
  schemaId: string;
  initialData?: {
    entityTypes: EntityType[];
    relationTypes: RelationType[];
  };
  onSave?: (data: SchemaData) => void;
  readOnly?: boolean;
}

interface SchemaEditorState {
  entityTypes: EntityType[];
  relationTypes: RelationType[];
  selectedNode: string | null;
  history: HistoryState[];
}

export const SchemaEditor: React.FC<SchemaEditorProps> = ({
  schemaId,
  initialData,
  onSave,
  readOnly = false
}) => {
  // ...
};
```

## 工作量估算
- **总工时**: 40h
- **类型定义**: 8h
- **后端迁移**: 16h
- **前端迁移**: 16h

## 迁移步骤

### Step 1: 配置TypeScript (4h)
```bash
# 安装依赖
npm install -D typescript @types/node @types/react @types/express

# 初始化配置
npx tsc --init
```

**tsconfig.json配置:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 2: 渐进式迁移 (32h)
- 保留.js文件同时添加.ts文件
- 使用`allowJs: true`配置
- 逐个模块迁移
- 每次迁移后运行测试

### Step 3: 清理 (4h)
- 删除.js文件
- 更新构建脚本
- 更新CI/CD

## 验收标准
- [ ] 所有.ts文件编译无错误
- [ ] `strict: true`模式通过
- [ ] 现有测试全部通过
- [ ] 代码覆盖率不降低
- [ ] 文档更新完成

## 收益
- 类型安全，减少运行时错误
- IDE智能提示，提升开发效率
- 更好的代码重构支持
- 自文档化代码

## 风险
- 迁移期间代码冲突风险
- 第三方库类型定义缺失
- 工作量超预期

## 回滚策略
- 保留原始.js文件备份
- 使用Git分支管理
- 可分模块独立回滚
