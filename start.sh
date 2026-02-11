#!/bin/bash

# 知识图谱系统一键启动脚本
# 后端端口: 8090
# 前端端口: 6060 (开发服务器)

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     本体图谱工程平台 - 一键启动脚本                      ║"
echo "║     Sprint 01: 多视图展示版本                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查Node.js
echo -e "${YELLOW}[1/6] 检查运行环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未安装 Node.js${NC}"
    echo "请先安装 Node.js (>=14.x): https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 版本: $(node -v)${NC}"
echo -e "${GREEN}✅ npm 版本: $(npm -v)${NC}"

# 检查端口占用
echo -e "\n${YELLOW}[2/6] 检查端口占用...${NC}"
if lsof -Pi :8090 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  端口 8090 已被占用，尝试停止...${NC}"
    lsof -ti:8090 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if lsof -Pi :6060 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  端口 6060 已被占用，尝试停止...${NC}"
    lsof -ti:6060 | xargs kill -9 2>/dev/null || true
    sleep 2
fi
echo -e "${GREEN}✅ 端口检查完成${NC}"

# 安装后端依赖
echo -e "\n${YELLOW}[3/6] 检查后端依赖...${NC}"
cd "$PROJECT_ROOT/backend"
if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖..."
    npm install
else
    echo -e "${GREEN}✅ 后端依赖已安装${NC}"
fi

# 安装前端依赖
echo -e "\n${YELLOW}[4/6] 检查前端依赖...${NC}"
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    echo "正在安装前端依赖..."
    npm install
else
    echo -e "${GREEN}✅ 前端依赖已安装${NC}"
fi

# 创建日志目录
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

# 启动后端服务
echo -e "\n${YELLOW}[5/6] 启动后端服务 (端口: 8090)...${NC}"
cd "$PROJECT_ROOT/backend"
PORT=8090 nohup npm start > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$LOG_DIR/backend.pid"
echo -e "${GREEN}✅ 后端服务已启动 (PID: $BACKEND_PID)${NC}"

# 等待后端启动
echo "等待后端服务就绪..."
sleep 3

# 检查后端是否启动成功
if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${RED}❌ 后端服务启动失败，请查看日志: $LOG_DIR/backend.log${NC}"
    exit 1
fi

# 启动前端服务
echo -e "\n${YELLOW}[6/6] 启动前端服务 (端口: 6060)...${NC}"
cd "$PROJECT_ROOT/frontend"
PORT=6060 nohup npm start > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"
echo -e "${GREEN}✅ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"

# 等待前端编译完成
echo "等待前端编译完成（约30-60秒）..."
sleep 10

# 输出启动信息
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  🎉 启动完成！                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}📊 服务信息:${NC}"
echo "  后端服务: http://localhost:8090"
echo "  前端应用: http://localhost:6060"
echo "  API文档:  http://localhost:8090/api/v1"
echo "  健康检查: http://localhost:8090/health"
echo ""

echo -e "${BLUE}📝 进程信息:${NC}"
echo "  后端PID: $BACKEND_PID"
echo "  前端PID: $FRONTEND_PID"
echo ""

echo -e "${BLUE}📋 日志文件:${NC}"
echo "  后端日志: $LOG_DIR/backend.log"
echo "  前端日志: $LOG_DIR/frontend.log"
echo ""

echo -e "${YELLOW}💡 提示:${NC}"
echo "  - 前端完全启动需要30-60秒，请耐心等待"
echo "  - 查看后端日志: tail -f $LOG_DIR/backend.log"
echo "  - 查看前端日志: tail -f $LOG_DIR/frontend.log"
echo "  - 停止服务: ./stop.sh"
echo ""

echo -e "${GREEN}✨ 正在打开浏览器...${NC}"
sleep 5

# 打开浏览器
if command -v open &> /dev/null; then
    open http://localhost:6060
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:6060
else
    echo "请手动打开浏览器访问: http://localhost:6060"
fi

echo -e "${GREEN}🚀 系统启动完成！${NC}"
