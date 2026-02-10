/**
 * 测试辅助函数
 */

const { expect } = require('@playwright/test');

/**
 * 等待图谱加载完成
 */
async function waitForGraphLoad(page) {
  // 等待Cytoscape容器出现
  await page.waitForSelector('#cy, . cytoscape-container, [data-testid="graph-view"]', { 
    state: 'visible',
    timeout: 10000 
  });
  // 额外等待渲染完成
  await page.waitForTimeout(2000);
}

/**
 * 等待表格加载完成
 */
async function waitForTableLoad(page) {
  await page.waitForSelector('.ant-table, [data-testid="table-view"]', { 
    state: 'visible',
    timeout: 10000 
  });
}

/**
 * 等待树形视图加载
 */
async function waitForTreeLoad(page) {
  await page.waitForSelector('.ant-tree, [data-testid="tree-view"]', { 
    state: 'visible',
    timeout: 10000 
  });
}

/**
 * 获取测试图谱ID（从URL中提取）
 */
function getGraphIdFromUrl(url) {
  const match = url.match(/\/graphs\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * 生成唯一的测试图谱名称
 */
function generateTestGraphName() {
  return `Test-Graph-${Date.now()}`;
}

/**
 * 清理测试数据
 */
async function cleanupTestGraphs(page) {
  // 返回列表页
  await page.goto('/graphs');
  await page.waitForTimeout(2000);
  
  // 查找并删除测试图谱
  const testCards = await page.locator('.ant-card:has-text("Test-Graph")').all();
  for (const card of testCards) {
    const deleteBtn = card.locator('button:has-text("删除")');
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await page.locator('.ant-modal-confirm-btns button:has-text("确定")').click();
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * 切换到指定视图
 */
async function switchView(page, viewName) {
  const viewMap = {
    'graph': '图谱',
    'table': '表格',
    'tree': '树形',
    'matrix': '矩阵',
    'dashboard': '仪表盘',
    'schema': 'Schema'
  };
  
  const label = viewMap[viewName] || viewName;
  await page.locator(`.ant-menu-item:has-text("${label}"), [data-testid="view-${viewName}"]`).click();
  await page.waitForTimeout(1500);
}

/**
 * 等待Ant Design消息提示消失
 */
async function waitForMessage(page) {
  await page.waitForSelector('.ant-message-notice', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);
}

module.exports = {
  waitForGraphLoad,
  waitForTableLoad,
  waitForTreeLoad,
  getGraphIdFromUrl,
  generateTestGraphName,
  cleanupTestGraphs,
  switchView,
  waitForMessage
};
