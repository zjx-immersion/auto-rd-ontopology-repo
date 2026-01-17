#!/bin/bash

# 查看服务状态脚本

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           知识图谱系统 - 服务状态                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# 检查后端服务
echo -e "${BLUE}【后端服务】${NC}"
if lsof -Pi :8090 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    BACKEND_PID=$(lsof -ti:8090)
    echo -e "  状态: ${GREEN}✅ 运行中${NC}"
    echo -e "  PID:  $BACKEND_PID"
    echo -e "  端口: 8090"
    echo -e "  地址: http://localhost:8090"
    
    # 健康检查
    if command -v curl &> /dev/null; then
        HEALTH=$(curl -s http://localhost:8090/health 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo -e "  健康: ${GREEN}✅ 正常${NC}"
        else
            echo -e "  健康: ${YELLOW}⚠️  无响应${NC}"
        fi
    fi
else
    echo -e "  状态: ${RED}❌ 未运行${NC}"
    if [ -f "$LOG_DIR/backend.pid" ]; then
        echo -e "  ${YELLOW}提示: PID文件存在但服务未运行，可能已崩溃${NC}"
    fi
fi

echo ""

# 检查前端服务
echo -e "${BLUE}【前端服务】${NC}"
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    FRONTEND_PID=$(lsof -ti:8080)
    echo -e "  状态: ${GREEN}✅ 运行中${NC}"
    echo -e "  PID:  $FRONTEND_PID"
    echo -e "  端口: 8080"
    echo -e "  地址: http://localhost:8080"
else
    echo -e "  状态: ${RED}❌ 未运行${NC}"
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        echo -e "  ${YELLOW}提示: PID文件存在但服务未运行，可能已崩溃${NC}"
    fi
fi

echo ""

# 系统资源使用情况
echo -e "${BLUE}【系统资源】${NC}"
if [ $(uname) = "Darwin" ]; then
    # macOS
    CPU_USAGE=$(ps -A -o %cpu | awk '{s+=$1} END {print s}')
    MEM_USAGE=$(ps -A -o %mem | awk '{s+=$1} END {print s}')
    echo -e "  CPU使用: ${CPU_USAGE}%"
    echo -e "  内存使用: ${MEM_USAGE}%"
else
    # Linux
    echo -e "  负载: $(uptime | awk -F'load average:' '{ print $2 }')"
fi

echo ""

# 日志文件
echo -e "${BLUE}【日志文件】${NC}"
if [ -d "$LOG_DIR" ]; then
    if [ -f "$LOG_DIR/backend.log" ]; then
        BACKEND_LOG_SIZE=$(du -h "$LOG_DIR/backend.log" | cut -f1)
        echo -e "  后端日志: ${BACKEND_LOG_SIZE} ($LOG_DIR/backend.log)"
    fi
    if [ -f "$LOG_DIR/frontend.log" ]; then
        FRONTEND_LOG_SIZE=$(du -h "$LOG_DIR/frontend.log" | cut -f1)
        echo -e "  前端日志: ${FRONTEND_LOG_SIZE} ($LOG_DIR/frontend.log)"
    fi
else
    echo -e "  ${YELLOW}日志目录不存在${NC}"
fi

echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo "  - 启动服务: ./start.sh"
echo "  - 停止服务: ./stop.sh"
echo "  - 查看日志: ./logs.sh"
echo ""
