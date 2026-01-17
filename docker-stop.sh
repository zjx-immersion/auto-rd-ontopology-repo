#!/bin/bash

# Docker服务停止脚本
# 用法: ./docker-stop.sh [sprint03|sprint05|all] [--remove-volumes]

set -e

SPRINT=${1:-sprint03}
REMOVE_VOLUMES=${2:-""}

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🛑 停止Docker服务 - Sprint ${SPRINT}                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 根据Sprint选择配置文件
case $SPRINT in
    sprint03)
        COMPOSE_FILE="docker-compose.sprint03.yml"
        ;;
    sprint05)
        COMPOSE_FILE="docker-compose.sprint05.yml"
        ;;
    all)
        COMPOSE_FILE="docker-compose.yml"
        ;;
    *)
        echo "❌ 未知的Sprint: $SPRINT"
        echo "用法: ./docker-stop.sh [sprint03|sprint05|all] [--remove-volumes]"
        exit 1
        ;;
esac

# 检查配置文件是否存在
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ 配置文件不存在: $COMPOSE_FILE"
    exit 1
fi

echo "🔄 停止服务..."
echo ""

# 停止服务
if [ "$REMOVE_VOLUMES" = "--remove-volumes" ] || [ "$REMOVE_VOLUMES" = "-v" ]; then
    echo "⚠️  警告: 将删除所有数据卷！"
    read -p "确认删除？(yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        docker-compose -f "$COMPOSE_FILE" down -v
        echo "✅ 服务已停止，数据卷已删除"
    else
        echo "❌ 操作已取消"
        exit 0
    fi
else
    docker-compose -f "$COMPOSE_FILE" down
    echo "✅ 服务已停止，数据卷已保留"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 提示:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  重新启动: ./docker-start.sh $SPRINT"
echo "  查看卷列表: docker volume ls"
echo "  删除所有卷: ./docker-stop.sh $SPRINT --remove-volumes"
echo ""
