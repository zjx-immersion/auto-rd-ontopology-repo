# 端口配置更新说明

**更新时间**: 2026-01-17  
**状态**: ✅ 已完成

---

## 🐛 问题描述

### 原始问题
前端页面加载图谱数据时报错：
```
数据加载失败: Network Error
GET http://localhost:3001/api/v1/graph/data net::ERR_CONNECTION_REFUSED
```

### 根本原因
1. **硬编码端口冲突**: `frontend/src/services/api.js` 中硬编码了 `http://localhost:3001`
2. **代理配置失效**: 即使修改了 `package.json` 的 proxy，硬编码的 baseURL 会优先生效
3. **前后端端口不匹配**: 启动脚本使用新端口，但代码仍使用旧端口

---

## ✅ 解决方案

### 新端口配置
```
前端应用: http://localhost:8080
后端服务: http://localhost:8090
```

### 修改文件列表

#### 1. `frontend/src/services/api.js`
**修改前**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
```

**修改后**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';
```

**说明**: 
- 改为使用**相对路径** `/api/v1`
- 依赖 webpack dev server 的 proxy 配置自动转发
- 支持通过环境变量 `REACT_APP_API_URL` 覆盖（用于生产环境）

---

#### 2. `frontend/package.json`
**修改前**:
```json
"proxy": "http://localhost:8088"
```

**修改后**:
```json
"proxy": "http://localhost:8090"
```

**说明**: 
- 将所有 `/api/*` 请求代理到后端 8090 端口
- 开发环境下前端和后端分离部署

---

#### 3. `start.sh` (启动脚本)
**主要修改**:
- 后端端口: `8088` → `8090`
- 前端端口: `3000` → `8080`
- 端口检测和清理逻辑更新
- 服务启动命令增加 `PORT` 环境变量

**关键代码**:
```bash
# 启动后端
PORT=8090 nohup npm start > "$LOG_DIR/backend.log" 2>&1 &

# 启动前端
PORT=8080 nohup npm start > "$LOG_DIR/frontend.log" 2>&1 &
```

---

#### 4. `stop.sh` (停止脚本)
**修改内容**:
- 端口检测: `8088/3000` → `8090/8080`
- 进程清理逻辑更新

---

#### 5. `status.sh` (状态监控脚本)
**修改内容**:
- 端口检测: `8088/3000` → `8090/8080`
- 健康检查 URL: `http://localhost:8088` → `http://localhost:8090`

---

## 🎯 验证结果

### 启动验证
```bash
./start.sh
```

**输出**:
```
✅ 后端服务已启动 (PID: 26430)
   端口: 8090
   地址: http://localhost:8090
   健康: ✅ 正常

✅ 前端服务已启动 (PID: 26496)
   端口: 8080
   地址: http://localhost:8080
```

### 数据加载验证
后端日志显示前端成功连接并请求数据：
```
[2026-01-16T17:37:06.521Z] GET /api/v1/graph/data
[2026-01-16T17:37:06.527Z] GET /api/v1/graph/schema
```

**数据加载**:
- ✅ 75个节点
- ✅ 83条边
- ✅ Schema加载成功

### 功能验证
- ✅ 前端页面正常加载
- ✅ 图谱数据正常显示
- ✅ 5种视图正常切换
- ✅ 所有API调用成功

---

## 📚 使用指南

### 启动系统
```bash
./start.sh
```

系统将自动启动：
- 后端服务在 **8090** 端口
- 前端应用在 **8080** 端口
- 浏览器自动打开 http://localhost:8080

### 访问地址
```
前端应用: http://localhost:8080
后端API:  http://localhost:8090/api/v1
健康检查: http://localhost:8090/health
```

### 查看状态
```bash
./status.sh
```

### 查看日志
```bash
./logs.sh
```

### 停止服务
```bash
./stop.sh
```

---

## 🔧 开发配置

### 环境变量
可以通过环境变量覆盖默认配置：

**后端端口**:
```bash
PORT=9000 npm start
```

**前端端口**:
```bash
PORT=3000 npm start
```

**前端API地址** (生产环境):
```bash
export REACT_APP_API_URL=https://api.example.com/api/v1
npm start
```

### 生产部署建议
1. **使用环境变量**: 不要在代码中硬编码端口
2. **使用相对路径**: API请求使用相对路径 `/api/v1`
3. **配置Nginx反向代理**: 将前后端部署在同一域名下
4. **CORS配置**: 如果前后端分离部署，确保后端配置CORS

---

## ⚠️ 注意事项

### 端口占用
如果端口已被占用，脚本会自动尝试清理。如果仍然失败：
```bash
# 手动清理端口
lsof -ti:8090 | xargs kill -9  # 清理后端
lsof -ti:8080 | xargs kill -9  # 清理前端
```

### 防火墙设置
确保防火墙允许访问：
- 8080 端口（前端）
- 8090 端口（后端）

### 代理配置说明
- **开发环境**: 使用 webpack dev server 的 proxy
- **生产环境**: 使用 Nginx 反向代理或设置 `REACT_APP_API_URL`

---

## 📝 变更历史

| 日期 | 版本 | 端口配置 | 说明 |
|------|------|----------|------|
| 2026-01-17 | v3 | 前端:8080 后端:8090 | 修复连接问题，统一端口配置 |
| 2026-01-17 | v2 | 前端:3000 后端:8088 | 初始一键启动脚本 |
| 初始版本 | v1 | 前端:3000 后端:3001 | 原始开发配置 |

---

## ✅ 检查清单

配置验证清单：
- [x] api.js 使用相对路径
- [x] package.json proxy 指向正确端口
- [x] start.sh 端口配置正确
- [x] stop.sh 端口检测正确
- [x] status.sh 状态检查正确
- [x] 后端成功启动并监听 8090
- [x] 前端成功启动并监听 8080
- [x] 前端能成功调用后端API
- [x] 数据正常加载显示
- [x] 所有视图功能正常

---

## 🆘 故障排查

### 问题1: 前端无法连接后端
**检查**:
1. 后端是否正常启动: `./status.sh`
2. 端口是否正确: 后端应该在 8090
3. 查看后端日志: `tail -f logs/backend.log`
4. 测试API: `curl http://localhost:8090/health`

### 问题2: 端口已被占用
**解决**:
```bash
./stop.sh  # 清理所有服务
sleep 2
./start.sh  # 重新启动
```

### 问题3: 数据加载失败
**检查**:
1. 后端日志中是否有错误
2. Schema文件是否存在: `data/core-domain-schema.json`
3. 数据文件是否存在: `data/graph-data.json`
4. 文件权限是否正确

---

**配置完成！系统已就绪！** 🚀

如有问题，请查看日志文件或运行状态检查脚本。
