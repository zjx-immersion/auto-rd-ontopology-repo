/**
 * Schema 可视化编辑器 - 冒烟测试
 * 简化版测试，验证核心功能
 */
const { test, expect } = require('@playwright/test');

test.describe('Schema Editor 冒烟测试', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/schema-editor');
    await page.waitForSelector('.schema-editor-layout', { timeout: 30000 });
  });

  test('SE-SMOKE-01: 页面加载正常', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('.toolbar-title')).toContainText('Schema 可视化编辑器');
    
    // 验证工具栏按钮存在
    await expect(page.locator('.schema-toolbar')).toBeVisible();
    
    // 验证画布区域
    await expect(page.locator('.react-flow')).toBeVisible();
    
    // 验证属性面板
    await expect(page.locator('.property-panel')).toBeVisible();
    
    // 截图记录
    await page.screenshot({ path: 'playwright-report/schema-editor-smoke-01.png' });
    
    console.log('✅ 页面加载正常');
  });

  test('SE-SMOKE-02: 画布显示现有Schema', async ({ page }) => {
    // 等待节点加载
    await page.waitForTimeout(2000);
    
    // 验证画布上有节点
    const nodes = page.locator('.entity-type-node');
    const count = await nodes.count();
    
    console.log(`✅ 画布上找到 ${count} 个实体类型节点`);
    
    // 截图记录
    await page.screenshot({ path: 'playwright-report/schema-editor-smoke-02.png' });
    
    expect(count).toBeGreaterThan(0);
  });

  test('SE-SMOKE-03: 可以选择实体节点', async ({ page }) => {
    // 等待节点加载
    await page.waitForTimeout(2000);
    
    // 获取第一个节点
    const firstNode = page.locator('.entity-type-node').first();
    
    // 点击节点（使用 force 避免被工具栏遮挡）
    await firstNode.click({ force: true });
    
    // 等待属性面板更新
    await page.waitForTimeout(500);
    
    // 验证属性面板显示实体类型信息
    await expect(page.locator('.property-panel')).toContainText('实体类型');
    
    // 截图记录
    await page.screenshot({ path: 'playwright-report/schema-editor-smoke-03.png' });
    
    console.log('✅ 实体节点选择正常');
  });

  test('SE-SMOKE-04: 工具按钮可用', async ({ page }) => {
    // 验证左侧工具栏按钮
    const toolButtons = page.locator('.schema-editor-sider button');
    const count = await toolButtons.count();
    
    console.log(`✅ 找到 ${count} 个工具按钮`);
    expect(count).toBeGreaterThanOrEqual(3);
    
    // 点击"选择"按钮
    await toolButtons.nth(0).click();
    
    // 点击"添加实体"按钮
    await toolButtons.nth(1).click();
    
    // 验证提示出现
    await expect(page.locator('.mode-hint')).toContainText('创建');
    
    // 截图记录
    await page.screenshot({ path: 'playwright-report/schema-editor-smoke-04.png' });
    
    console.log('✅ 工具按钮正常');
  });

  test('SE-SMOKE-05: 画布控件可用', async ({ page }) => {
    // 验证 Controls
    await expect(page.locator('.react-flow__controls')).toBeVisible();
    
    // 点击放大
    await page.click('.react-flow__controls-zoomin');
    
    // 点击缩小
    await page.click('.react-flow__controls-zoomout');
    
    // 点击适应视图
    await page.click('.react-flow__controls-fitview');
    
    // 截图记录
    await page.screenshot({ path: 'playwright-report/schema-editor-smoke-05.png' });
    
    console.log('✅ 画布控件正常');
  });

});
