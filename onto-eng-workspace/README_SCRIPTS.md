# 🚀 知识图谱系统 - 启动脚本使用指南

## 📋 脚本列表

| 脚本 | 功能 | 用法 |
|------|------|------|
| `start.sh` | 一键启动系统（后端+前端） | `./start.sh` |
| `stop.sh` | 停止所有服务 | `./stop.sh` |
| `status.sh` | 查看服务状态 | `./status.sh` |
| `logs.sh` | 查看和监控日志 | `./logs.sh` |

---

## 🎯 快速开始

### 1️⃣ 一键启动

```bash
./start.sh
```

**功能**：
- ✅ 自动检查 Node.js 环境
- ✅ 检查并清理端口占用
- ✅ 安装必要的依赖包
- ✅ 启动后端服务（端口：8088）
- ✅ 启动前端服务（端口：3000）
- ✅ 自动打开浏览器

**启动后访问**：
- 前端应用：http://localhost:3000
- 后端API：http://localhost:8088
- 健康检查：http://localhost:8088/health

---

### 2️⃣ 停止服务

```bash
./stop.sh
```

**功能**：
- ✅ 优雅停止后端和前端服务
- ✅ 清理PID文件
- ✅ 强制杀死残留进程

---

### 3️⃣ 查看状态

```bash
./status.sh
```

**显示信息**：
- 后端服务状态（运行中/未运行）
- 前端服务状态（运行中/未运行）
- 进程PID和端口信息
- 健康检查结果
- 系统资源使用情况
- 日志文件大小

**示例输出**：
```
╔════════════════════════════════════════════════════════════╗
║           知识图谱系统 - 服务状态                        ║
╚════════════════════════════════════════════════════════════╝

【后端服务】
  状态: ✅ 运行中
  PID:  12345
  端口: 8088
  地址: http://localhost:8088
  健康: ✅ 正常

【前端服务】
  状态: ✅ 运行中
  PID:  12346
  端口: 3000
  地址: http://localhost:3000
```

---

### 4️⃣ 查看日志

```bash
./logs.sh
```

**交互式菜单**：
1. 查看后端日志（完整）
2. 查看前端日志（最近100行）
3. 实时监控后端日志（tail -f）
4. 实时监控前端日志（tail -f）
5. 清空日志
6. 退出

**日志文件位置**：
- 后端日志：`logs/backend.log`
- 前端日志：`logs/frontend.log`
- PID文件：`logs/backend.pid`, `logs/frontend.pid`

---

## 🔧 端口配置

### 默认端口
- **后端服务**：8088
- **前端开发服务器**：3000
- **前端代理**：请求自动代理到 http://localhost:8088

### 修改端口

#### 修改后端端口
编辑 `start.sh`，修改第85行：
```bash
PORT=8088 nohup npm start > "$LOG_DIR/backend.log" 2>&1 &
# 改为你想要的端口，例如：
PORT=9000 nohup npm start > "$LOG_DIR/backend.log" 2>&1 &
```

同时修改 `frontend/package.json` 的 proxy 配置：
```json
"proxy": "http://localhost:9000"
```

#### 修改前端端口
设置环境变量 `PORT`：
```bash
PORT=8080 ./start.sh
```

或修改 `start.sh`，在启动前端前添加：
```bash
export PORT=8080
```

---

## 📝 使用场景

### 场景1：日常开发

```bash
# 启动系统
./start.sh

# 开发中...

# 查看日志排查问题
./logs.sh

# 停止服务
./stop.sh
```

### 场景2：检查服务状态

```bash
# 启动系统
./start.sh

# 等待30秒后检查状态
sleep 30
./status.sh
```

### 场景3：监控日志

```bash
# 在一个终端启动服务
./start.sh

# 在另一个终端实时监控后端日志
./logs.sh
# 选择 "3. 实时监控后端日志"
```

### 场景4：重启服务

```bash
# 停止服务
./stop.sh

# 等待2秒
sleep 2

# 重新启动
./start.sh
```

---

## 🐛 故障排查

### 问题1：端口已被占用

**现象**：启动失败，提示端口已被占用

**解决方案**：
```bash
# 脚本会自动尝试清理端口
# 如果仍然失败，手动清理：
lsof -ti:8088 | xargs kill -9  # 清理后端端口
lsof -ti:3000 | xargs kill -9  # 清理前端端口

# 然后重新启动
./start.sh
```

### 问题2：服务启动失败

**现象**：脚本显示启动成功，但访问不了

**解决方案**：
```bash
# 1. 查看服务状态
./status.sh

# 2. 查看日志
./logs.sh

# 3. 检查后端日志中的错误信息
tail -50 logs/backend.log

# 4. 检查前端日志中的编译错误
tail -100 logs/frontend.log
```

### 问题3：前端编译很慢

**现象**：前端启动需要很长时间

**原因**：首次启动需要编译所有依赖（30-60秒）

**解决方案**：
```bash
# 耐心等待，查看前端日志
tail -f logs/frontend.log

# 看到 "webpack compiled with warnings" 表示编译完成
```

### 问题4：依赖安装失败

**现象**：启动时提示依赖安装失败

**解决方案**：
```bash
# 清理并重新安装依赖
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install

# 返回根目录重新启动
cd ..
./start.sh
```

### 问题5：日志文件过大

**现象**：日志文件占用大量磁盘空间

**解决方案**：
```bash
# 使用日志管理脚本清空
./logs.sh
# 选择 "5. 清空日志"

# 或手动清理
rm -f logs/*.log
```

---

## 🔐 权限问题

如果遇到权限问题：

```bash
# 赋予脚本执行权限
chmod +x start.sh stop.sh logs.sh status.sh

# 确保logs目录可写
mkdir -p logs
chmod 755 logs
```

---

## 🌟 最佳实践

1. **开发前先检查状态**
   ```bash
   ./status.sh  # 确保服务未运行或正常运行
   ```

2. **使用日志监控**
   - 开发时在单独终端实时监控日志
   - 发现问题立即查看日志详情

3. **定期清理日志**
   - 日志文件会随时间增长
   - 建议每周清理一次

4. **优雅停止服务**
   - 始终使用 `./stop.sh` 而不是直接 kill
   - 避免残留进程和文件锁

---

## 📚 相关文档

- [Sprint 01 快速开始](SPRINT_01_QUICK_START.md)
- [Sprint 01 交付文档](onto-eng-workspace/SPRINT_01_DELIVERY.md)
- [系统需求文档](onto-eng-workspace/01-REQUIREMENTS.md)

---

## 💡 提示

- 所有脚本都支持在项目根目录执行
- 日志文件位于 `logs/` 目录（会自动创建）
- 服务PID保存在 `logs/*.pid` 文件中
- 后端支持通过环境变量 `PORT` 修改端口
- 前端代理配置在 `frontend/package.json` 中

---

**版本**: v1.0  
**更新日期**: 2026-01-17  
**Sprint**: 01 - 多视图展示
