#!/bin/bash

# 查看日志脚本

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

echo -e "${BLUE}知识图谱系统 - 日志查看${NC}\n"

if [ ! -d "$LOG_DIR" ]; then
    echo -e "${YELLOW}日志目录不存在，服务可能未启动${NC}"
    exit 1
fi

PS3="请选择操作: "
options=("查看后端日志" "查看前端日志" "实时监控后端日志" "实时监控前端日志" "清空日志" "退出")

select opt in "${options[@]}"
do
    case $opt in
        "查看后端日志")
            if [ -f "$LOG_DIR/backend.log" ]; then
                echo -e "\n${GREEN}=== 后端日志 ===${NC}"
                cat "$LOG_DIR/backend.log"
            else
                echo -e "${YELLOW}后端日志文件不存在${NC}"
            fi
            ;;
        "查看前端日志")
            if [ -f "$LOG_DIR/frontend.log" ]; then
                echo -e "\n${GREEN}=== 前端日志 ===${NC}"
                tail -100 "$LOG_DIR/frontend.log"
            else
                echo -e "${YELLOW}前端日志文件不存在${NC}"
            fi
            ;;
        "实时监控后端日志")
            if [ -f "$LOG_DIR/backend.log" ]; then
                echo -e "\n${GREEN}=== 实时监控后端日志 (Ctrl+C退出) ===${NC}"
                tail -f "$LOG_DIR/backend.log"
            else
                echo -e "${YELLOW}后端日志文件不存在${NC}"
            fi
            ;;
        "实时监控前端日志")
            if [ -f "$LOG_DIR/frontend.log" ]; then
                echo -e "\n${GREEN}=== 实时监控前端日志 (Ctrl+C退出) ===${NC}"
                tail -f "$LOG_DIR/frontend.log"
            else
                echo -e "${YELLOW}前端日志文件不存在${NC}"
            fi
            ;;
        "清空日志")
            echo -e "${YELLOW}正在清空日志...${NC}"
            rm -f "$LOG_DIR"/*.log
            echo -e "${GREEN}✅ 日志已清空${NC}"
            ;;
        "退出")
            break
            ;;
        *) 
            echo -e "${YELLOW}无效选项 $REPLY${NC}"
            ;;
    esac
done
