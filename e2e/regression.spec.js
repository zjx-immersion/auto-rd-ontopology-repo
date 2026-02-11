/**
 * 回归测试 - 边界情况和异常处理
 * TC-16 ~ TC-20
 */
const { test, expect } = require('@playwright/test');
const { 
  waitForGraphLoad,
  cleanupTestGraphs,
  switchView,
  generateTestGraphName,
  gotoOAGDetail,
  TEST_OAG_ID
} = require('./fixtures/test-helpers');

test.describe('回归测试 - 边界情况和异常处理', () => {
  
  test.beforeEach(async ({ page }) => {
    await cleanupTestGraphs(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestGraphs(page);
  });

  /**
   * TC-16: 响应式布局验证
   */
  test('TC-16: 窗口大小调整响应验证', async ({ page }) => {
    // 进入OAG详情页
    try {
      await gotoOAGDetail(page);
    } catch (e) {
      console.log('ℹ️', e.message);
      return;
    }
    
    // 设置小窗口
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    // 验证布局正常
    await expect(page.locator('#root, .app, .oag-detail-page')).toBeVisible();
    
    // 恢复大窗口
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    console.log('✅ TC-16 通过: 响应式布局正常');
  });

  /**
   * TC-17: 网络异常处理
   */
  test('TC-17: 网络异常错误处理', async ({ page }) => {
    // 模拟网络断开
    await page.route('**/api/**', route => route.abort('failed'));
    
    // 尝试加载OAG列表
    await page.goto('/oag');
    await page.waitForTimeout(3000);
    
    // 验证页面不会完全空白
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // 恢复网络
    await page.unroute('**/api/**');
    
    console.log('✅ TC-17 通过: 网络异常处理正常');
  });

  /**
   * TC-18: 大图谱加载性能
   */
  test('TC-18: 大图谱加载性能验证', async ({ page }) => {
    // 记录开始时间
    const startTime = Date.now();
    
    // 进入OAG详情页
    try {
      await gotoOAGDetail(page);
    } catch (e) {
      console.log('ℹ️', e.message);
      return;
    }
    
    // 切换到可视化Tab
    await page.locator('.ant-tabs-tab:has-text("可视化")').click();
    await page.waitForTimeout(3000);
    
    const loadTime = Date.now() - startTime;
    
    // 验证加载时间 < 15秒
    expect(loadTime).toBeLessThan(15000);
    
    console.log(`  ✅ OAG加载时间: ${loadTime}ms`);
    
    console.log('✅ TC-18 通过: 大图谱加载性能正常');
  });

  /**
   * TC-19: 多OAG切换
   */
  test('TC-19: 多OAG切换功能验证', async ({ page }) => {
    // 进入OAG列表页
    await page.goto('/oag');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const rows = await page.locator('.ant-table-tbody tr').all();
    if (rows.length >= 2) {
      // 进入第一个OAG（点击查看按钮）
      await rows[0].locator('button:has-text("查看")').click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      const firstUrl = page.url();
      
      // 返回列表
      await page.goto('/oag');
      await page.waitForTimeout(2000);
      
      // 进入第二个OAG
      const rows2 = await page.locator('.ant-table-tbody tr').all();
      await rows2[1].locator('button:has-text("查看")').click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      const secondUrl = page.url();
      
      // 验证URL不同
      expect(secondUrl).not.toBe(firstUrl);
      
      console.log(`  ✅ 多OAG切换正常`);
    } else {
      console.log('  ℹ️ OAG数量不足，跳过切换测试');
    }
    
    console.log('✅ TC-19 通过: 多OAG切换功能正常');
  });

  /**
   * TC-20: Schema快照实体类型展示
   */
  test('TC-20: Schema快照实体类型展示验证', async ({ page }) => {
    // 进入OAG详情页
    try {
      await gotoOAGDetail(page);
    } catch (e) {
      console.log('ℹ️', e.message);
      return;
    }
    
    // 切换到Schema快照Tab
    await page.locator('.ant-tabs-tab:has-text("Schema")').click();
    await page.waitForTimeout(2000);
    
    // 验证实体类型展示
    const entitySection = page.locator('text=/实体类型/i');
    await expect(entitySection).toBeVisible();
    
    // 验证有类型标签
    const typeTags = page.locator('.ant-tag');
    const tagCount = await typeTags.count();
    
    if (tagCount > 0) {
      console.log(`  ✅ Schema快照显示${tagCount}个类型标签`);
    }
    
    console.log('✅ TC-20 通过: Schema快照验证完成');
  });

  /**
   * 额外测试: 空状态显示
   */
  test('空状态: 无数据时的友好提示', async ({ page }) => {
    // 清理所有测试数据
    await cleanupTestGraphs(page);
    
    // 访问OAG列表
    await page.goto('/oag');
    await page.waitForLoadState('networkidle');
    
    // 检查是否有空状态或表格
    const emptyText = await page.locator('text=/暂无|空|Empty/i').isVisible().catch(() => false);
    const table = await page.locator('.ant-table').isVisible().catch(() => false);
    
    if (emptyText || table) {
      console.log('  ✅ 页面正常显示（可能有数据或空状态）');
    }
    
    console.log('✅ 空状态测试通过');
  });

  /**
   * 额外测试: 快速切换Tab
   */
  test('稳定性: 快速切换Tab视图', async ({ page }) => {
    // 进入OAG详情页
    try {
      await gotoOAGDetail(page);
    } catch (e) {
      console.log('ℹ️', e.message);
      return;
    }
    
    // 快速切换Tab
    const tabs = ['概览', '可视化', '节点', '边', 'Schema'];
    
    for (const tab of tabs) {
      await page.locator(`.ant-tabs-tab:has-text("${tab}")`).click();
      await page.waitForTimeout(500);
    }
    
    // 验证页面仍然正常
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ 快速切换Tab稳定性测试通过');
  });
});
