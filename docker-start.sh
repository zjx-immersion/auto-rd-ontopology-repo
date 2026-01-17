#!/bin/bash

# Docker服务启动脚本
# 用法: ./docker-start.sh [sprint03|sprint05|all]

set -e

SPRINT=${1:-sprint03}

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🐳 启动Docker服务 - Sprint ${SPRINT}                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 根据Sprint选择配置文件
case $SPRINT in
    sprint03)
        COMPOSE_FILE="docker-compose.sprint03.yml"
        echo "📦 Sprint 03 服务: Elasticsearch + Kibana + Redis"
        ;;
    sprint05)
        COMPOSE_FILE="docker-compose.sprint05.yml"
        echo "📦 Sprint 05 服务: ES + Redis + Neo4j + Jena + RabbitMQ"
        ;;
    all)
        COMPOSE_FILE="docker-compose.yml"
        echo "📦 全部服务: 包含所有可选服务"
        ;;
    *)
        echo "❌ 未知的Sprint: $SPRINT"
        echo "用法: ./docker-start.sh [sprint03|sprint05|all]"
        exit 1
        ;;
esac

# 检查配置文件是否存在
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ 配置文件不存在: $COMPOSE_FILE"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 启动服务..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 启动服务
docker-compose -f "$COMPOSE_FILE" up -d

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ 等待服务健康检查..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 等待服务启动
sleep 10

# 检查服务状态
echo "📊 服务状态:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 健康检查:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 健康检查
if command -v curl &> /dev/null; then
    # Elasticsearch
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo "✅ Elasticsearch: 正常 (http://localhost:9200)"
    else
        echo "⏳ Elasticsearch: 启动中..."
    fi
    
    # Redis
    if command -v redis-cli &> /dev/null && redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis: 正常 (localhost:6379)"
    else
        echo "⏳ Redis: 启动中..."
    fi
    
    # Kibana (Sprint 03)
    if [ "$SPRINT" = "sprint03" ]; then
        if curl -s http://localhost:5601/api/status > /dev/null 2>&1; then
            echo "✅ Kibana: 正常 (http://localhost:5601)"
        else
            echo "⏳ Kibana: 启动中..."
        fi
    fi
    
    # Neo4j (Sprint 05+)
    if [ "$SPRINT" = "sprint05" ] || [ "$SPRINT" = "all" ]; then
        if curl -s http://localhost:7474 > /dev/null 2>&1; then
            echo "✅ Neo4j: 正常 (http://localhost:7474)"
        else
            echo "⏳ Neo4j: 启动中..."
        fi
        
        if curl -s http://localhost:3030/$/ping > /dev/null 2>&1; then
            echo "✅ Jena Fuseki: 正常 (http://localhost:3030)"
        else
            echo "⏳ Jena Fuseki: 启动中..."
        fi
        
        if curl -s -u admin:admin123 http://localhost:15672/api/overview > /dev/null 2>&1; then
            echo "✅ RabbitMQ: 正常 (http://localhost:15672)"
        else
            echo "⏳ RabbitMQ: 启动中..."
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 服务访问地址:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Elasticsearch: http://localhost:9200"
echo "  Kibana:        http://localhost:5601"
echo "  Redis:         localhost:6379"

if [ "$SPRINT" = "sprint05" ] || [ "$SPRINT" = "all" ]; then
    echo "  Neo4j Browser: http://localhost:7474"
    echo "  Neo4j Bolt:    bolt://localhost:7687"
    echo "  Jena Fuseki:   http://localhost:3030"
    echo "  RabbitMQ UI:   http://localhost:15672 (admin/admin123)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 提示:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  查看日志: docker-compose -f $COMPOSE_FILE logs -f"
echo "  停止服务: docker-compose -f $COMPOSE_FILE down"
echo "  重启服务: docker-compose -f $COMPOSE_FILE restart"
echo ""
echo "✅ Docker服务启动完成！"
echo ""
