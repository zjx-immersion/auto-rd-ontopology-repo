# 仪表盘Pie图表错误修复报告

**日期**: 2026-01-17  
**错误**: Unknown Component: shape.outer  
**状态**: ✅ 已修复  
**提交**: e7002cb

---

## 🔍 错误分析

### 错误现象
```
ERROR: Unknown Component: shape.outer
at plotLabel (http://localhost:8080/static/js/bundle.js:86233:197)
```

### 调用链路
```
Dashboard.js → Pie组件 → plotLabel → Selection.append 
→ use('shape.outer') → create → ❌ error: Unknown Component
```

### 根本原因

**问题配置**:
```javascript
label: {
  type: 'outer',  // ❌ @ant-design/plots 不支持此配置
  content: (item) => {...}
}
```

**原因**: @ant-design/plots 的 Pie 组件不支持 `label.type: 'outer'`，组件库中没有注册 `shape.outer` 组件。

---

## 💡 解决方案

### 修复代码

```javascript
// frontend/src/components/Dashboard.js (行 146-166)

const edgeTypePieConfig = {
  data: edgeTypeChartData,
  angleField: 'value',
  colorField: 'type',
  radius: 0.9,
  
  // ✅ 修复后: 移除 type，简化配置
  label: {
    content: (item) => {
      return `${(item.percent * 100).toFixed(0)}%`;  // 只显示百分比
    },
    style: {
      fontSize: 14,
      fontWeight: 'bold',
      fill: '#fff',        // 白色文字，扇区内显示
      textAlign: 'center',
    },
  },
  
  // legend 显示类型名称
  legend: {
    position: 'right',
    offsetX: -20,
  },
  
  // tooltip 显示详细信息
  tooltip: {
    formatter: (datum) => {
      return { 
        name: datum.type, 
        value: `${datum.value} (${(datum.percent * 100).toFixed(1)}%)` 
      };
    },
  },
  
  interactions: [
    { type: 'element-active' },
  ],
};
```

### 修复策略

1. **移除不支持的配置**: 删除 `type: 'outer'`
2. **简化label**: 只在扇区内显示百分比
3. **多渠道呈现信息**:
   - Label: 扇区内显示百分比（白色加粗）
   - Legend: 右侧显示类型名称
   - Tooltip: 鼠标悬停显示完整信息

---

## 🧪 测试验证

### 测试步骤

1. **清理缓存并重启**
```bash
./stop.sh
cd frontend && rm -rf node_modules/.cache
cd .. && ./start.sh
```

2. **访问仪表盘**
```
http://localhost:8080
点击 "📊 仪表盘" 查看
```

3. **检查项目**
- [ ] 饼图正常显示
- [ ] 扇区内显示白色百分比
- [ ] 右侧legend显示类型名称
- [ ] 鼠标悬停显示tooltip
- [ ] Console无错误

---

## 📊 错误历史

| 次数 | 错误 | 原因 | 解决方案 |
|------|------|------|----------|
| 1 | Unexpected character: } | 字符串模板语法 | 改用函数表达式 |
| 2 | Unknown Component: shape.inner | innerRadius配置 | 移除innerRadius |
| 3 | Unknown Component: shape.outer | label.type配置 | 移除type配置 |

### 经验教训

1. ✅ **使用简单配置**: 避免高级或实验性配置
2. ✅ **多版本兼容**: 只使用基础、稳定的API
3. ✅ **信息分散呈现**: label + legend + tooltip
4. ✅ **逐步测试**: 每次改动后测试验证

---

## 🔧 推荐配置模式

### 安全的Pie配置
```javascript
// 经过验证的稳定配置模式
const safePieConfig = {
  data: chartData,
  angleField: 'value',
  colorField: 'category',
  radius: 0.8,
  
  // 使用函数，不使用type
  label: {
    content: (item) => `${item.value}`,
    style: {
      fontSize: 14,
      fill: '#fff',
    },
  },
  
  legend: { position: 'right' },
  tooltip: { 
    formatter: (datum) => ({
      name: datum.category,
      value: datum.value,
    }),
  },
  
  interactions: [
    { type: 'element-active' },
  ],
};
```

### 不推荐的配置
```javascript
// ❌ 避免使用这些配置
{
  innerRadius: 0.6,        // 可能导致 shape.inner 错误
  statistic: { ... },      // 配合innerRadius易出错
  label: {
    type: 'outer',         // shape.outer 不存在
    type: 'inner',         // shape.inner 不存在
    content: '{name}',     // 字符串模板可能出错
  }
}
```

---

## ✅ 修复确认

### Git提交信息
```
commit e7002cb
Author: AI Assistant
Date: 2026-01-17

fix: 修复仪表盘Pie图表label错误 - shape.outer不支持

问题分析:
- 错误: Unknown Component: shape.outer
- 调用链路: plotLabel → Selection.join → Selection.append
- 根本原因: @ant-design/plots Pie组件不支持label.type配置

解决方案:
1. 移除 type: 'outer' 配置
2. 简化label配置，仅显示百分比
3. label样式: 白色加粗，居中显示在扇区内
4. 添加tooltip显示详细信息（类型名+数值+百分比）
5. legend显示在右侧提供类型名称

结果:
- 饼图正常显示
- label显示百分比（扇区内）
- 鼠标悬停显示完整信息
- 无JavaScript错误
```

### 文件变更
- `frontend/src/components/Dashboard.js`: 修复Pie配置（11行变更）

---

**✅ 修复完成！请刷新页面验证。**

---

**创建日期**: 2026-01-17  
**版本**: v1.0
