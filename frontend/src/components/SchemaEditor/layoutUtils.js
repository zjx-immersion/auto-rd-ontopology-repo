import { forceSimulation, forceManyBody, forceCenter, forceLink, forceCollide, forceX, forceY } from 'd3-force';

/**
 * Schema 编辑器智能布局工具
 * 使用力导向布局算法优化节点位置
 */

/**
 * 计算智能布局
 * @param {Array} nodes - React Flow 节点
 * @param {Array} edges - React Flow 边
 * @param {Object} options - 布局选项
 * @returns {Array} 带有新位置的节点
 */
export function calculateSmartLayout(nodes, edges, options = {}) {
  const {
    width = 1200,
    height = 800,
    nodeSpacing = 150,
    linkDistance = 200,
    chargeStrength = -800,
    centerStrength = 0.05,
    iterations = 300
  } = options;

  if (nodes.length === 0) return nodes;

  // 准备 D3 节点数据
  const d3Nodes = nodes.map(node => ({
    id: node.id,
    x: node.position?.x || Math.random() * width,
    y: node.position?.y || Math.random() * height,
    width: node.data?.entityType?.width || 180,
    height: node.data?.entityType?.height || 80,
    // 根据连接数设置质量（连接越多，质量越大，移动越慢）
    mass: 1 + (edges.filter(e => e.source === node.id || e.target === node.id).length * 0.5)
  }));

  // 准备 D3 连接数据
  const d3Links = edges
    .filter(edge => edge.source && edge.target)
    .map(edge => ({
      source: edge.source,
      target: edge.target,
      // 关系强度（可以根据关系类型设置不同强度）
      strength: edge.data?.relationType?.strength || 0.5
    }));

  // 创建力导向模拟
  const simulation = forceSimulation(d3Nodes)
    // 节点间斥力（防止重叠）
    .force('charge', forceManyBody()
      .strength(chargeStrength)
      .distanceMax(400)
    )
    // 连接引力（关联节点靠近）
    .force('link', forceLink(d3Links)
      .id(d => d.id)
      .distance(linkDistance)
      .strength(d => d.strength || 0.5)
    )
    // 节点碰撞检测（确保不重叠）
    .force('collision', forceCollide()
      .radius(d => Math.max(d.width, d.height) / 2 + nodeSpacing / 2)
      .strength(1)
      .iterations(3)
    )
    // 向中心聚集
    .force('center', forceCenter(width / 2, height / 2)
      .strength(centerStrength)
    )
    // Y轴方向分组力（根据实体类型分组）
    .force('y', forceY(d => {
      // 可以根据实体类型的层次结构调整Y位置
      const entityType = nodes.find(n => n.id === d.id)?.data?.entityType;
      if (entityType?.parentType) {
        return height * 0.7; // 子类型在下
      }
      return height * 0.3; // 父类型在上
    }).strength(0.1))
    .stop();

  // 运行模拟
  simulation.tick(iterations);

  // 将计算后的位置应用到节点
  return nodes.map(node => {
    const d3Node = d3Nodes.find(n => n.id === node.id);
    if (d3Node) {
      return {
        ...node,
        position: {
          x: Math.round(d3Node.x),
          y: Math.round(d3Node.y)
        }
      };
    }
    return node;
  });
}

/**
 * 层次布局 - 适合有继承关系的 Schema
 * @param {Array} nodes - React Flow 节点
 * @param {Array} edges - React Flow 边
 * @param {Object} options - 布局选项
 */
export function calculateHierarchicalLayout(nodes, edges, options = {}) {
  const {
    width = 1200,
    height = 800,
    levelHeight = 180,
    nodeWidth = 200
  } = options;

  if (nodes.length === 0) return nodes;

  // 构建层次结构
  const levels = new Map(); // level -> nodes
  const visited = new Set();

  // 找出根节点（没有父类型的）
  const rootNodes = nodes.filter(node => {
    const entityType = node.data?.entityType;
    return !entityType?.parentType;
  });

  // BFS 分层
  let currentLevel = 0;
  let currentNodes = rootNodes;

  while (currentNodes.length > 0) {
    levels.set(currentLevel, currentNodes);
    currentNodes.forEach(n => visited.add(n.id));

    // 找到下一层的节点（当前层的子类型）
    const nextLevelNodes = [];
    currentNodes.forEach(node => {
      const children = nodes.filter(n => {
        const parentType = n.data?.entityType?.parentType;
        return parentType === node.data?.entityType?.id;
      });
      nextLevelNodes.push(...children);
    });

    currentNodes = nextLevelNodes;
    currentLevel++;
  }

  // 为未分层的节点分配层级（孤立节点放最下层）
  const unvisitedNodes = nodes.filter(n => !visited.has(n.id));
  if (unvisitedNodes.length > 0) {
    levels.set(currentLevel, unvisitedNodes);
  }

  // 计算位置
  const positionedNodes = nodes.map(node => {
    // 找到节点所在层级
    let nodeLevel = 0;
    let indexInLevel = 0;
    
    for (const [level, levelNodes] of levels) {
      const idx = levelNodes.findIndex(n => n.id === node.id);
      if (idx !== -1) {
        nodeLevel = level;
        indexInLevel = idx;
        break;
      }
    }

    const levelNodeCount = levels.get(nodeLevel)?.length || 1;
    const levelWidth = levelNodeCount * nodeWidth;
    const startX = (width - levelWidth) / 2 + nodeWidth / 2;

    return {
      ...node,
      position: {
        x: startX + indexInLevel * nodeWidth,
        y: 100 + nodeLevel * levelHeight
      }
    };
  });

  return positionedNodes;
}

/**
 * 根据连接密度布局 - 关联强的节点聚集
 * @param {Array} nodes - React Flow 节点
 * @param {Array} edges - React Flow 边
 * @param {Object} options - 布局选项
 */
export function calculateClusterLayout(nodes, edges, options = {}) {
  const {
    width = 1200,
    height = 800,
    clusterPadding = 100
  } = options;

  if (nodes.length === 0) return nodes;

  // 使用并查集找到连通分量（聚类）
  const parent = new Map();
  
  function find(x) {
    if (!parent.has(x)) {
      parent.set(x, x);
    }
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)));
    }
    return parent.get(x);
  }

  function union(x, y) {
    const px = find(x);
    const py = find(y);
    if (px !== py) {
      parent.set(px, py);
    }
  }

  // 合并连接的节点
  edges.forEach(edge => {
    if (edge.source && edge.target) {
      union(edge.source, edge.target);
    }
  });

  // 分组
  const clusters = new Map();
  nodes.forEach(node => {
    const root = find(node.id);
    if (!clusters.has(root)) {
      clusters.set(root, []);
    }
    clusters.get(root).push(node);
  });

  // 为每个聚类计算位置
  const clusterCount = clusters.size;
  const cols = Math.ceil(Math.sqrt(clusterCount));
  const rows = Math.ceil(clusterCount / cols);
  
  const clusterWidth = width / cols;
  const clusterHeight = height / rows;

  let clusterIndex = 0;
  const positionedNodes = [];

  for (const [rootId, clusterNodes] of clusters) {
    const col = clusterIndex % cols;
    const row = Math.floor(clusterIndex / cols);
    
    const clusterCenterX = col * clusterWidth + clusterWidth / 2;
    const clusterCenterY = row * clusterHeight + clusterHeight / 2;

    // 在聚类内部使用力导向布局
    const clusterLayout = calculateSmartLayout(
      clusterNodes,
      edges.filter(e => 
        clusterNodes.some(n => n.id === e.source) &&
        clusterNodes.some(n => n.id === e.target)
      ),
      {
        width: clusterWidth - clusterPadding,
        height: clusterHeight - clusterPadding,
        nodeSpacing: 120,
        linkDistance: 150,
        iterations: 100
      }
    );

    // 调整位置到聚类中心
    clusterLayout.forEach(node => {
      positionedNodes.push({
        ...node,
        position: {
          x: node.position.x + clusterCenterX - (clusterWidth - clusterPadding) / 2,
          y: node.position.y + clusterCenterY - (clusterHeight - clusterPadding) / 2
        }
      });
    });

    clusterIndex++;
  }

  return positionedNodes;
}

/**
 * 自动选择最佳布局算法
 * @param {Array} nodes - React Flow 节点
 * @param {Array} edges - React Flow 边
 * @param {String} type - 布局类型: 'force' | 'hierarchical' | 'cluster' | 'auto'
 */
export function autoLayout(nodes, edges, type = 'auto') {
  if (nodes.length === 0) return nodes;

  // 根据图的特征自动选择布局
  if (type === 'auto') {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    const density = edgeCount / (nodeCount * (nodeCount - 1) / 2);

    // 如果有明显的层次结构，使用层次布局
    const hasHierarchy = nodes.some(n => n.data?.entityType?.parentType);
    if (hasHierarchy && nodeCount < 50) {
      type = 'hierarchical';
    } else if (density > 0.3 && nodeCount > 30) {
      // 高密度图使用聚类布局
      type = 'cluster';
    } else {
      // 默认使用力导向布局
      type = 'force';
    }
  }

  switch (type) {
    case 'hierarchical':
      return calculateHierarchicalLayout(nodes, edges);
    case 'cluster':
      return calculateClusterLayout(nodes, edges);
    case 'force':
    default:
      return calculateSmartLayout(nodes, edges);
  }
}

/**
 * 增量布局 - 只重新布局变化的节点
 * @param {Array} allNodes - 所有节点
 * @param {Array} allEdges - 所有边
 * @param {Array} changedNodeIds - 变化的节点ID
 */
export function incrementalLayout(allNodes, allEdges, changedNodeIds) {
  // 保持未变化节点位置不变，只调整变化节点及其邻居
  const changedNodes = allNodes.filter(n => changedNodeIds.includes(n.id));
  const neighborIds = new Set();
  
  // 找到变化节点的邻居
  changedNodeIds.forEach(id => {
    allEdges.forEach(edge => {
      if (edge.source === id) neighborIds.add(edge.target);
      if (edge.target === id) neighborIds.add(edge.source);
    });
  });

  const affectedNodes = allNodes.filter(n => 
    changedNodeIds.includes(n.id) || neighborIds.has(n.id)
  );

  // 只对受影响的节点进行布局
  const layoutedNodes = calculateSmartLayout(
    affectedNodes,
    allEdges.filter(e => 
      affectedNodes.some(n => n.id === e.source) &&
      affectedNodes.some(n => n.id === e.target)
    ),
    { iterations: 50 }
  );

  // 合并结果
  const positionedMap = new Map(layoutedNodes.map(n => [n.id, n]));
  
  return allNodes.map(node => {
    if (positionedMap.has(node.id)) {
      return positionedMap.get(node.id);
    }
    return node;
  });
}
