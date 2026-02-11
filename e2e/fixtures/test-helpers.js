/**
 * 测试辅助函数
 */

// 固定的测试OAG ID（用于详情页测试）
const TEST_OAG_ID = '0b96e712-6017-4122-a24b-77f8cb3b0165';

/**
 * 等待图谱加载完成
 */
async function waitForGraphLoad(page) {
  // 等待Cytoscape容器出现 - OAG详情页使用react-cytoscapejs
  await page.waitForSelector('.oag-detail-page, [data-testid="oag-detail"]', { 
    state: 'visible',
    timeout: 10000 
  });
  // 切换到可视化Tab
  await page.locator('.ant-tabs-tab:has-text("可视化"), button:has-text("可视化")').first().click();
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
  const match = url.match(/\/oag\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * 生成唯一的测试图谱名称
 */
function generateTestGraphName() {
  return `Test-Graph-${Date.now()}`;
}

/**
 * 清理测试数据 - 只清理以"Test-Graph"开头的测试OAG
 */
async function cleanupTestGraphs(page) {
  try {
    // 返回OAG列表页
    await page.goto('/oag');
    await page.waitForTimeout(2000);
    
    // 查找并删除测试OAG (通过Table中的行，只清理Test-Graph开头的)
    const allRows = await page.locator('.ant-table-tbody tr').all();
    for (const row of allRows) {
      const rowText = await row.textContent().catch(() => '');
      if (rowText.includes('Test-Graph')) {
        const deleteBtn = row.locator('button:has-text("删除")');
        if (await deleteBtn.isVisible().catch(() => false)) {
          await deleteBtn.click();
          // 等待确认弹窗并确认
          await page.waitForSelector('.ant-popover, .ant-modal-confirm', { state: 'visible', timeout: 5000 }).catch(() => {});
          await page.locator('.ant-popover-buttons button:has-text("删除"), .ant-btn-danger').last().click().catch(() => {});
          await page.waitForTimeout(1000);
        }
      }
    }
  } catch (e) {
    // 清理失败不影响测试
    console.log('  ℹ️ 清理测试数据时出错:', e.message);
  }
}

/**
 * 切换到指定视图 - OAG详情页使用Tabs
 */
async function switchView(page, viewName) {
  const viewMap = {
    'graph': '可视化',
    'table': '节点',      // 节点Tab使用Table展示
    'tree': '节点',       // 树形视图在节点Tab中
    'matrix': '边',       // 矩阵视图在边Tab中
    'dashboard': '概览',  // 仪表盘对应概览Tab
    'schema': 'Schema'
  };
  
  const label = viewMap[viewName] || viewName;
  // OAG详情页使用Ant Design Tabs
  const tabSelector = `.ant-tabs-tab:has-text("${label}"), .ant-tabs-tab-btn:has-text("${label}")`;
  await page.locator(tabSelector).first().click();
  await page.waitForTimeout(1500);
}

/**
 * 等待Ant Design消息提示消失
 */
async function waitForMessage(page) {
  await page.waitForSelector('.ant-message-notice', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(1000);
}

/**
 * 进入OAG详情页（使用固定测试OAG）
 */
async function gotoOAGDetail(page) {
  await page.goto(`/oag/${TEST_OAG_ID}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 检查页面是否加载成功
  const emptyState = await page.locator('text=/OAG 不存在|Empty/i').isVisible().catch(() => false);
  if (emptyState) {
    throw new Error('测试OAG不存在，无法继续测试');
  }
}

module.exports = {
  TEST_OAG_ID,
  waitForGraphLoad,
  waitForTableLoad,
  waitForTreeLoad,
  getGraphIdFromUrl,
  generateTestGraphName,
  cleanupTestGraphs,
  switchView,
  waitForMessage,
  gotoOAGDetail
};
