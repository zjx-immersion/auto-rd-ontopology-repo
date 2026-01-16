#!/bin/bash

# 知识图谱系统停止脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           知识图谱系统 - 停止服务                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 停止后端
if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止后端服务 (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
        # 强制杀死
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ 后端服务已停止${NC}"
    else
        echo -e "${YELLOW}后端服务未运行${NC}"
    fi
    rm -f "$LOG_DIR/backend.pid"
else
    # 尝试通过端口查找并停止
    if lsof -Pi :8088 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}通过端口停止后端服务...${NC}"
        lsof -ti:8088 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ 后端服务已停止${NC}"
    else
        echo -e "${YELLOW}后端服务未运行${NC}"
    fi
fi

# 停止前端
if [ -f "$LOG_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}停止前端服务 (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 2
        # 强制杀死
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ 前端服务已停止${NC}"
    else
        echo -e "${YELLOW}前端服务未运行${NC}"
    fi
    rm -f "$LOG_DIR/frontend.pid"
else
    # 尝试通过端口查找并停止
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}通过端口停止前端服务...${NC}"
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ 前端服务已停止${NC}"
    else
        echo -e "${YELLOW}前端服务未运行${NC}"
    fi
fi

# 清理node进程（如果有残留）
pkill -f "node.*backend/src/server.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

echo -e "\n${GREEN}✅ 所有服务已停止${NC}"
