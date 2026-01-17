# 🐳 Docker部署指南 - 第三方服务容器化

**创建日期**: 2026-01-17  
**版本**: v1.0  
**原则**: 所有第三方数据库和工具使用Docker，避免本地安装  

---

## 📋 目录

1. [概述](#概述)
2. [服务清单](#服务清单)
3. [Docker Compose配置](#docker-compose配置)
4. [分阶段部署](#分阶段部署)
5. [服务详细配置](#服务详细配置)
6. [网络配置](#网络配置)
7. [数据持久化](#数据持久化)
8. [健康检查](#健康检查)
9. [使用指南](#使用指南)

---

## 🎯 概述

### 设计原则

1. **零本地安装**: 所有第三方服务使用Docker容器
2. **一键启动**: docker-compose一键启动所有服务
3. **数据持久化**: 使用Docker volumes持久化数据
4. **开发友好**: 映射端口便于本地开发调试
5. **生产就绪**: 配置可直接用于生产环境

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Host Machine                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Docker Compose Network                    │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │  Neo4j       │  │ Elasticsearch│  │  Redis    │ │   │
│  │  │  :7474       │  │  :9200       │  │  :6379    │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │  RabbitMQ    │  │  Pellet      │  │  Jena     │ │   │
│  │  │  :5672,15672 │  │  Reasoner    │  │  Fuseki   │ │   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Application (Backend + Frontend)              │  │
│  │         Backend:8090  |  Frontend:8080                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 服务清单

### Sprint 03-04 所需服务

| 服务 | 用途 | Docker镜像 | 端口映射 | 优先级 |
|------|------|-----------|---------|--------|
| **Elasticsearch** | 智能搜索、全文检索 | elasticsearch:8.11.0 | 9200:9200 | P0 高 |
| **Kibana** | ES可视化管理 | kibana:8.11.0 | 5601:5601 | P1 中 |
| **Redis** | 缓存、会话存储 | redis:7-alpine | 6379:6379 | P1 中 |

### Sprint 05-06 所需服务

| 服务 | 用途 | Docker镜像 | 端口映射 | 优先级 |
|------|------|-----------|---------|--------|
| **Neo4j** | 图数据库存储 | neo4j:5.15-community | 7474:7474, 7687:7687 | P0 高 |
| **Apache Jena Fuseki** | RDF存储、SPARQL查询 | stain/jena-fuseki | 3030:3030 | P0 高 |
| **RabbitMQ** | 消息队列 | rabbitmq:3-management | 5672:5672, 15672:15672 | P1 中 |

### 可选服务（按需）

| 服务 | 用途 | Docker镜像 | 端口映射 | 优先级 |
|------|------|-----------|---------|--------|
| **PostgreSQL** | 关系型数据库 | postgres:16-alpine | 5432:5432 | P2 低 |
| **MinIO** | 对象存储（S3兼容） | minio/minio | 9000:9000, 9001:9001 | P2 低 |
| **Grafana** | 监控可视化 | grafana/grafana | 3000:3000 | P3 低 |

---

## 🐋 Docker Compose配置

### 基础配置文件

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # ==================== Sprint 03-04 服务 ====================
  
  # Elasticsearch - 智能搜索
  elasticsearch:
    image: elasticsearch:8.11.0
    container_name: onto-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - bootstrap.memory_lock=true
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - es-data:/usr/share/elasticsearch/data
    networks:
      - onto-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped

  # Kibana - ES可视化
  kibana:
    image: kibana:8.11.0
    container_name: onto-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - onto-network
    restart: unless-stopped

  # Redis - 缓存
  redis:
    image: redis:7-alpine
    container_name: onto-redis
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - onto-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  # ==================== Sprint 05-06 服务 ====================
  
  # Neo4j - 图数据库
  neo4j:
    image: neo4j:5.15-community
    container_name: onto-neo4j
    environment:
      - NEO4J_AUTH=neo4j/password123
      - NEO4J_dbms_memory_pagecache_size=512M
      - NEO4J_dbms_memory_heap_initial__size=512M
      - NEO4J_dbms_memory_heap_max__size=2G
    ports:
      - "7474:7474"  # HTTP
      - "7687:7687"  # Bolt
    volumes:
      - neo4j-data:/data
      - neo4j-logs:/logs
      - neo4j-import:/var/lib/neo4j/import
      - neo4j-plugins:/plugins
    networks:
      - onto-network
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:7474 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped

  # Apache Jena Fuseki - RDF存储
  jena-fuseki:
    image: stain/jena-fuseki
    container_name: onto-jena-fuseki
    environment:
      - ADMIN_PASSWORD=admin123
      - JVM_ARGS=-Xmx2g
    ports:
      - "3030:3030"
    volumes:
      - fuseki-data:/fuseki
    networks:
      - onto-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3030/$/ping || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped

  # RabbitMQ - 消息队列
  rabbitmq:
    image: rabbitmq:3-management
    container_name: onto-rabbitmq
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin123
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - onto-network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped

  # ==================== 可选服务 ====================
  
  # PostgreSQL - 关系型数据库
  postgres:
    image: postgres:16-alpine
    container_name: onto-postgres
    environment:
      - POSTGRES_USER=onto
      - POSTGRES_PASSWORD=onto123
      - POSTGRES_DB=ontology
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - onto-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U onto"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # MinIO - 对象存储
  minio:
    image: minio/minio
    container_name: onto-minio
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    volumes:
      - minio-data:/data
    networks:
      - onto-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

# 网络配置
networks:
  onto-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16

# 数据卷
volumes:
  es-data:
    driver: local
  redis-data:
    driver: local
  neo4j-data:
    driver: local
  neo4j-logs:
    driver: local
  neo4j-import:
    driver: local
  neo4j-plugins:
    driver: local
  fuseki-data:
    driver: local
  rabbitmq-data:
    driver: local
  postgres-data:
    driver: local
  minio-data:
    driver: local
```

---

## 📅 分阶段部署

### Sprint 03: 智能搜索（最小配置）

创建 `docker-compose.sprint03.yml`:

```yaml
version: '3.8'

services:
  # 仅启动Sprint 03所需服务
  elasticsearch:
    extends:
      file: docker-compose.yml
      service: elasticsearch
  
  kibana:
    extends:
      file: docker-compose.yml
      service: kibana
  
  redis:
    extends:
      file: docker-compose.yml
      service: redis

networks:
  onto-network:
    driver: bridge

volumes:
  es-data:
  redis-data:
```

**启动命令**:
```bash
docker-compose -f docker-compose.sprint03.yml up -d
```

### Sprint 05: 图数据库+推理

创建 `docker-compose.sprint05.yml`:

```yaml
version: '3.8'

services:
  # Sprint 03 服务
  elasticsearch:
    extends:
      file: docker-compose.yml
      service: elasticsearch
  
  redis:
    extends:
      file: docker-compose.yml
      service: redis
  
  # Sprint 05 新增服务
  neo4j:
    extends:
      file: docker-compose.yml
      service: neo4j
  
  jena-fuseki:
    extends:
      file: docker-compose.yml
      service: jena-fuseki
  
  rabbitmq:
    extends:
      file: docker-compose.yml
      service: rabbitmq

networks:
  onto-network:
    driver: bridge

volumes:
  es-data:
  redis-data:
  neo4j-data:
  neo4j-logs:
  neo4j-import:
  neo4j-plugins:
  fuseki-data:
  rabbitmq-data:
```

**启动命令**:
```bash
docker-compose -f docker-compose.sprint05.yml up -d
```

---

## ⚙️ 服务详细配置

### 1. Elasticsearch配置

#### 性能调优
```yaml
elasticsearch:
  environment:
    # 内存配置（根据机器调整）
    - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
    
    # 禁用安全（开发环境）
    - xpack.security.enabled=false
    
    # 禁用ML（节省资源）
    - xpack.ml.enabled=false
    
    # 单节点模式
    - discovery.type=single-node
```

#### 索引模板
在应用启动时创建：

```javascript
// backend/src/config/elasticsearch-setup.js
const { Client } = require('@elastic/elasticsearch');

async function setupElasticsearch() {
  const client = new Client({ node: 'http://localhost:9200' });
  
  // 创建节点索引
  await client.indices.create({
    index: 'ontology_nodes',
    body: {
      mappings: {
        properties: {
          id: { type: 'keyword' },
          type: { type: 'keyword' },
          label: { type: 'text', analyzer: 'standard' },
          description: { type: 'text' },
          properties: { type: 'object', enabled: true },
          created_at: { type: 'date' },
          updated_at: { type: 'date' }
        }
      }
    }
  });
}
```

### 2. Neo4j配置

#### 初始化脚本
创建 `docker/neo4j/init.cypher`:

```cypher
// 创建约束
CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE;

// 创建索引
CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type);
CREATE INDEX entity_label IF NOT EXISTS FOR (e:Entity) ON (e.label);

// 创建关系类型索引
CREATE INDEX rel_type IF NOT EXISTS FOR ()-[r:RELATION]-() ON (r.type);
```

#### 连接配置
```javascript
// backend/src/config/neo4j.js
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password123'),
  {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 60000
  }
);

module.exports = driver;
```

### 3. Jena Fuseki配置

#### 数据集创建
```bash
# 访问管理界面创建数据集
curl -X POST http://localhost:3030/$/datasets \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "dbName=ontology&dbType=tdb2"
```

#### SPARQL查询示例
```javascript
// backend/src/services/SPARQLService.js
const axios = require('axios');

async function querySPARQL(query) {
  const response = await axios.post(
    'http://localhost:3030/ontology/sparql',
    `query=${encodeURIComponent(query)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json'
      }
    }
  );
  
  return response.data;
}
```

### 4. Redis配置

#### 连接配置
```javascript
// backend/src/config/redis.js
const Redis = require('ioredis');

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  db: 0,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

module.exports = redis;
```

### 5. RabbitMQ配置

#### 连接配置
```javascript
// backend/src/config/rabbitmq.js
const amqp = require('amqplib');

let connection, channel;

async function connectRabbitMQ() {
  connection = await amqp.connect('amqp://admin:admin123@localhost:5672');
  channel = await connection.createChannel();
  
  // 声明队列
  await channel.assertQueue('ontology_tasks', { durable: true });
  
  return channel;
}

module.exports = { connectRabbitMQ };
```

---

## 🌐 网络配置

### 服务间通信

```yaml
# 应用访问Docker服务
networks:
  onto-network:
    driver: bridge
```

### 环境变量配置

创建 `.env`:

```bash
# Docker服务配置
ELASTICSEARCH_URL=http://localhost:9200
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123
FUSEKI_URL=http://localhost:3030/ontology
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# 应用配置
NODE_ENV=development
PORT=8090
```

---

## 💾 数据持久化

### 数据卷管理

```bash
# 查看所有卷
docker volume ls

# 查看特定卷详情
docker volume inspect onto-neo4j-data

# 备份卷数据
docker run --rm -v onto-neo4j-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/neo4j-backup.tar.gz -C /data .

# 恢复卷数据
docker run --rm -v onto-neo4j-data:/data -v $(pwd)/backup:/backup alpine tar xzf /backup/neo4j-backup.tar.gz -C /data
```

### 备份脚本

创建 `scripts/backup-docker-data.sh`:

```bash
#!/bin/bash

BACKUP_DIR="./docker-backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🔄 开始备份Docker数据..."

# 备份各服务数据
services=("neo4j-data" "es-data" "redis-data" "fuseki-data" "rabbitmq-data")

for service in "${services[@]}"; do
  echo "备份 $service..."
  docker run --rm \
    -v "onto-$service:/data" \
    -v "$(pwd)/$BACKUP_DIR:/backup" \
    alpine tar czf "/backup/$service.tar.gz" -C /data .
done

echo "✅ 备份完成: $BACKUP_DIR"
```

---

## 🏥 健康检查

### 统一健康检查脚本

创建 `scripts/check-docker-health.sh`:

```bash
#!/bin/bash

echo "🏥 检查Docker服务健康状态..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Elasticsearch
echo -n "Elasticsearch: "
curl -s http://localhost:9200/_cluster/health | jq -r '.status' || echo "❌ 不可用"

# Redis
echo -n "Redis: "
redis-cli ping 2>/dev/null || echo "❌ 不可用"

# Neo4j
echo -n "Neo4j: "
curl -s http://localhost:7474 > /dev/null && echo "✅ 正常" || echo "❌ 不可用"

# Jena Fuseki
echo -n "Jena Fuseki: "
curl -s http://localhost:3030/$/ping > /dev/null && echo "✅ 正常" || echo "❌ 不可用"

# RabbitMQ
echo -n "RabbitMQ: "
curl -s -u admin:admin123 http://localhost:15672/api/overview > /dev/null && echo "✅ 正常" || echo "❌ 不可用"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## 📖 使用指南

### 快速开始

#### 1. 安装Docker和Docker Compose

```bash
# 检查Docker版本
docker --version
docker-compose --version
```

#### 2. 启动服务（Sprint 03）

```bash
# 启动Sprint 03所需服务
docker-compose -f docker-compose.sprint03.yml up -d

# 查看日志
docker-compose -f docker-compose.sprint03.yml logs -f

# 检查状态
docker-compose -f docker-compose.sprint03.yml ps
```

#### 3. 验证服务

```bash
# Elasticsearch
curl http://localhost:9200

# Kibana
open http://localhost:5601

# Redis
redis-cli ping
```

#### 4. 停止服务

```bash
# 停止并保留数据
docker-compose -f docker-compose.sprint03.yml down

# 停止并删除数据
docker-compose -f docker-compose.sprint03.yml down -v
```

### 常用命令

```bash
# 查看所有运行的容器
docker ps

# 查看容器日志
docker logs -f onto-elasticsearch

# 进入容器Shell
docker exec -it onto-elasticsearch /bin/bash

# 重启特定服务
docker-compose restart elasticsearch

# 查看资源使用
docker stats

# 清理未使用的资源
docker system prune -a
```

### 开发环境配置

在 `backend/.env`:

```bash
# 使用Docker服务
ELASTICSEARCH_URL=http://localhost:9200
NEO4J_URI=bolt://localhost:7687
REDIS_URL=redis://localhost:6379
```

### 生产环境配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  elasticsearch:
    # ... 基础配置 ...
    environment:
      # 启用安全
      - xpack.security.enabled=true
      # 增加资源
      - "ES_JAVA_OPTS=-Xms4g -Xmx4g"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

---

## 🔍 故障排查

### 常见问题

#### 1. Elasticsearch启动失败

```bash
# 检查日志
docker logs onto-elasticsearch

# 常见原因: vm.max_map_count设置过低
sudo sysctl -w vm.max_map_count=262144

# 永久设置
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

#### 2. Neo4j无法连接

```bash
# 检查端口
netstat -an | grep 7687

# 检查认证
docker exec onto-neo4j neo4j-admin dbms set-initial-password password123
```

#### 3. 容器内存不足

```yaml
# 限制内存使用
services:
  elasticsearch:
    mem_limit: 2g
    memswap_limit: 2g
```

---

## 📚 参考资料

### 官方文档
- Elasticsearch: https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html
- Neo4j: https://neo4j.com/docs/operations-manual/current/docker/
- Redis: https://hub.docker.com/_/redis
- RabbitMQ: https://www.rabbitmq.com/download.html
- Jena Fuseki: https://jena.apache.org/documentation/fuseki2/

### 最佳实践
- Docker Compose最佳实践: https://docs.docker.com/compose/production/
- 容器监控: Prometheus + Grafana
- 日志聚合: ELK Stack

---

## ✅ 检查清单

在开始新Sprint之前，确认：

- [ ] Docker和Docker Compose已安装
- [ ] 必要的端口未被占用
- [ ] 有足够的磁盘空间（至少20GB）
- [ ] vm.max_map_count已设置（Linux）
- [ ] docker-compose文件已创建
- [ ] 环境变量已配置
- [ ] 健康检查脚本可用
- [ ] 备份策略已制定

---

**🎉 所有第三方服务已容器化，零本地安装！**

**下一步**: 根据Sprint阶段，使用对应的docker-compose文件启动服务。

---

**创建日期**: 2026-01-17  
**版本**: v1.0  
**维护**: 随Sprint更新
