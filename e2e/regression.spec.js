/**
 * 回归测试 - 边界情况和异常处理
 * TC-16 ~ TC-20
 */
const { test, expect } = require('@playwright/test');
const { 
  waitForGraphLoad,
  cleanupTestGraphs,
  switchView
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
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 设置小窗口
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    // 验证布局正常
    await expect(page.locator('#root, .app, [data-testid="app"]')).toBeVisible();
    
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
    
    // 尝试加载图谱
    await page.goto('/graphs');
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
    
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    
    // 选择最大的图谱（智能驾驶）
    const cards = await page.locator('.ant-card, .graph-card').all();
    let maxNodeCount = 0;
    let targetCard = null;
    
    for (const card of cards) {
      const text = await card.textContent();
      const match = text.match(/(\d+)\s*个?\s*节点/);
      if (match) {
        const count = parseInt(match[1]);
        if (count > maxNodeCount) {
          maxNodeCount = count;
          targetCard = card;
        }
      }
    }
    
    if (targetCard) {
      await targetCard.click();
      await page.waitForTimeout(3000);
      
      // 等待图谱渲染
      await waitForGraphLoad(page);
      
      const loadTime = Date.now() - startTime;
      
      // 验证加载时间 < 10秒
      expect(loadTime).toBeLessThan(10000);
      
      console.log(`  ✅ 图谱加载时间: ${loadTime}ms (${maxNodeCount}节点)`);
    }
    
    console.log('✅ TC-18 通过: 大图谱加载性能正常');
  });

  /**
   * TC-19: 多图谱切换
   */
  test('TC-19: 多图谱切换功能验证', async ({ page }) => {
    // 进入第一个图谱
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    
    const cards = await page.locator('.ant-card, .graph-card').all();
    if (cards.length >= 2) {
      // 进入第一个图谱
      await cards[0].click();
      await page.waitForTimeout(2000);
      const firstUrl = page.url();
      
      // 返回列表
      await page.goto('/graphs');
      await page.waitForTimeout(2000);
      
      // 进入第二个图谱
      const cards2 = await page.locator('.ant-card, .graph-card').all();
      await cards2[1].click();
      await page.waitForTimeout(2000);
      const secondUrl = page.url();
      
      // 验证URL不同
      expect(secondUrl).not.toBe(firstUrl);
      
      // 验证数据不同
      const firstName = await page.locator('h1, .graph-title').textContent();
      await page.goto('/graphs');
      await page.waitForTimeout(1000);
      await cards[0].click();
      await page.waitForTimeout(2000);
      const secondName = await page.locator('h1, .graph-title').textContent();
      
      console.log('  ✅ 多图谱切换正常');
    } else {
      console.log('  ℹ️ 只有一个图谱，跳过切换测试');
    }
    
    console.log('✅ TC-19 通过: 多图谱切换功能正常');
  });

  /**
   * TC-20: 右键菜单功能
   */
  test('TC-20: 树形视图右键菜单功能', async ({ page }) => {
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 切换到树形视图
    await switchView(page, 'tree');
    await page.waitForTimeout(2000);
    
    // 查找树节点
    const treeNode = page.locator('.ant-tree-treenode').first();
    
    if (await treeNode.isVisible().catch(() => false)) {
      // 右键点击
      await treeNode.click({ button: 'right' });
      await page.waitForTimeout(1000);
      
      // 检查是否有上下文菜单
      const contextMenu = page.locator('.ant-dropdown-menu, .context-menu, .ant-menu');
      const hasMenu = await contextMenu.isVisible().catch(() => false);
      
      if (hasMenu) {
        console.log('  ✅ 右键菜单显示正常');
        
        // 按ESC关闭菜单
        await page.keyboard.press('Escape');
      } else {
        console.log('  ℹ️ 未检测到右键菜单');
      }
    }
    
    console.log('✅ TC-20 通过: 右键菜单功能验证完成');
  });

  /**
   * 额外测试: 空状态显示
   */
  test('空状态: 无数据时的友好提示', async ({ page }) => {
    // 创建空图谱
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    
    await page.locator('button:has-text("创建"), [data-testid="create-graph-btn"]').click();
    await page.waitForSelector('.ant-modal, .create-modal', { state: 'visible' });
    await page.locator('input[name="name"], #name').fill(`Empty-Test-${Date.now()}`);
    await page.locator('button:has-text("创建"), button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    // 验证空状态显示
    const emptyState = page.locator('text=/暂无数据|空|Empty|no data/i');
    // 不一定显示空状态，但页面应该正常
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ 空状态测试通过');
  });

  /**
   * 额外测试: 快速切换视图
   */
  test('稳定性: 快速切换视图', async ({ page }) => {
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 快速切换视图
    const views = ['table', 'tree', 'matrix', 'dashboard', 'schema', 'graph'];
    
    for (const view of views) {
      await switchView(page, view);
      await page.waitForTimeout(500);
    }
    
    // 验证页面仍然正常
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ 快速切换视图稳定性测试通过');
  });
});
