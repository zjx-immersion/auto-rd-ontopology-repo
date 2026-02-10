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
 * 层次布局 - 按领域/分类分组，每类一行，多行排列
 * @param {Array} nodes - React Flow 节点
 * @param {Array} edges - React Flow 边
 * @param {Object} options - 布局选项
 */
export function calculateHierarchicalLayout(nodes, edges, options = {}) {
  const {
    width = 1400,
    height = 900,
    rowHeight = 140,        // 每行高度
    nodeWidth = 180,        // 节点宽度
    nodeHeight = 80,        // 节点高度
    horizontalSpacing = 40, // 水平间距
    verticalSpacing = 60,   // 垂直间距（行内节点之间）
    marginX = 100,          // 左右边距
    marginY = 80            // 上下边距
  } = options;

  if (nodes.length === 0) return nodes;

  // 按领域/分类分组
  const groups = new Map();
  
  nodes.forEach(node => {
    const entityType = node.data?.entityType;
    // 使用 domain 字段作为分类，如果没有则使用 '其他'
    const category = entityType?.domain || entityType?.category || '其他';
    
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category).push(node);
  });

  // 按领域名称排序，保持稳定的布局
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // 计算每行的位置
  const positionedNodes = [];
  let currentY = marginY;

  sortedGroups.forEach(([category, groupNodes]) => {
    const nodeCount = groupNodes.length;
    
    // 计算每行可以容纳的节点数
    const availableWidth = width - 2 * marginX;
    const nodeTotalWidth = nodeWidth + horizontalSpacing;
    const nodesPerRow = Math.max(1, Math.floor(availableWidth / nodeTotalWidth));
    
    // 计算需要多少行来容纳这个分类的所有节点
    const rowsNeeded = Math.ceil(nodeCount / nodesPerRow);
    
    // 布局这个分类的节点
    groupNodes.forEach((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      
      // 计算位置：每类一行（或多行如果节点太多）
      const actualRow = currentY / rowHeight + row;
      const x = marginX + col * nodeTotalWidth + nodeWidth / 2;
      const y = currentY + row * rowHeight;

      positionedNodes.push({
        ...node,
        position: { x, y },
        // 添加分类信息用于显示
        data: {
          ...node.data,
          _layoutCategory: category,
          _layoutRow: row
        }
      });
    });

    // 更新 Y 位置到下一分类
    currentY += rowsNeeded * rowHeight + verticalSpacing;
  });

  return positionedNodes;
}

/**
 * 基于继承关系的树形层次布局
 * @param {Array} nodes - React Flow 节点
 * @param {Array} edges - React Flow 边
 * @param {Object} options - 布局选项
 */
export function calculateTreeLayout(nodes, edges, options = {}) {
  const {
    width = 1400,
    height = 900,
    levelHeight = 150,      // 每层高度
    nodeWidth = 180,
    nodeHeight = 80,
    siblingSpacing = 40,    // 兄弟节点间距
    subtreeSpacing = 60     // 子树间距
  } = options;

  if (nodes.length === 0) return nodes;

  // 构建父子关系图
  const childrenMap = new Map(); // parentId -> [childNodes]
  const parentMap = new Map();   // nodeId -> parentId
  
  nodes.forEach(node => {
    const entityType = node.data?.entityType;
    const parentType = entityType?.parentType;
    
    if (parentType) {
      parentMap.set(node.id, parentType);
      if (!childrenMap.has(parentType)) {
        childrenMap.set(parentType, []);
      }
      childrenMap.get(parentType).push(node);
    }
  });

  // 找到根节点（没有父类型的）
  const rootNodes = nodes.filter(node => {
    const entityType = node.data?.entityType;
    return !entityType?.parentType;
  });

  // 如果没有根节点，使用第一个节点作为根
  const roots = rootNodes.length > 0 ? rootNodes : [nodes[0]];

  // 计算每个节点的布局位置（后序遍历）
  const positionedMap = new Map();
  
  function layoutNode(node, level, offsetX) {
    const children = childrenMap.get(node.data?.entityType?.id) || [];
    let currentX = offsetX;
    
    if (children.length === 0) {
      // 叶子节点
      currentX += nodeWidth / 2;
      positionedMap.set(node.id, {
        ...node,
        position: {
          x: currentX,
          y: 80 + level * levelHeight
        }
      });
      currentX += nodeWidth / 2 + siblingSpacing;
    } else {
      // 非叶子节点：先布局子节点
      let childrenWidth = 0;
      children.forEach((child, i) => {
        const childResult = layoutNode(child, level + 1, offsetX + childrenWidth);
        childrenWidth = childResult.offsetX - offsetX;
      });
      
      // 父节点位于子节点的中心
      const firstChild = positionedMap.get(children[0].id);
      const lastChild = positionedMap.get(children[children.length - 1].id);
      const parentX = (firstChild.position.x + lastChild.position.x) / 2;
      
      positionedMap.set(node.id, {
        ...node,
        position: {
          x: parentX,
          y: 80 + level * levelHeight
        }
      });
      
      currentX = offsetX + childrenWidth;
    }
    
    return { offsetX: currentX };
  }

  // 布局所有根节点
  let globalOffsetX = width / 2 - (roots.length * nodeWidth) / 2;
  roots.forEach(root => {
    const result = layoutNode(root, 0, globalOffsetX);
    globalOffsetX = result.offsetX + subtreeSpacing;
  });

  // 返回所有已定位的节点
  return nodes.map(node => positionedMap.get(node.id) || {
    ...node,
    position: { x: width / 2, y: height / 2 }
  });
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
