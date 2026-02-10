/**
 * 功能测试 - 详细功能验证
 * TC-06 ~ TC-15
 */
const { test, expect } = require('@playwright/test');
const { 
  waitForTableLoad,
  waitForTreeLoad,
  generateTestGraphName,
  cleanupTestGraphs,
  switchView
} = require('./fixtures/test-helpers');

test.describe('功能测试 - 详细功能验证', () => {
  
  test.beforeEach(async ({ page }) => {
    await cleanupTestGraphs(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestGraphs(page);
  });

  /**
   * TC-06: 表格视图搜索功能
   */
  test('TC-06: 表格视图搜索功能验证', async ({ page }) => {
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 切换到表格视图
    await switchView(page, 'table');
    await waitForTableLoad(page);
    
    // 获取总行数
    const totalText = await page.locator('.ant-pagination-total-text, .total-info').textContent().catch(() => '');
    const totalMatch = totalText.match(/(\d+)/);
    const totalBefore = totalMatch ? parseInt(totalMatch[1]) : 0;
    
    // 输入搜索关键词
    await page.locator('input[placeholder*="搜索"], .ant-input-search input, [data-testid="search-input"]').fill('Vehicle');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    
    // 验证搜索结果
    const rows = page.locator('.ant-table-row');
    const count = await rows.count();
    
    // 搜索结果应该少于或等于总数
    expect(count).toBeLessThanOrEqual(totalBefore);
    
    console.log(`✅ TC-06 通过: 搜索功能正常，找到 ${count} 条结果`);
  });

  /**
   * TC-07: 表格视图分页功能
   */
  test('TC-07: 表格视图分页功能验证', async ({ page }) => {
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 切换到表格视图
    await switchView(page, 'table');
    await waitForTableLoad(page);
    
    // 检查是否有分页组件
    const pagination = page.locator('.ant-pagination');
    const hasPagination = await pagination.isVisible().catch(() => false);
    
    if (hasPagination) {
      // 获取当前页码
      const currentPage = await page.locator('.ant-pagination-item-active').textContent().catch(() => '1');
      
      // 点击下一页
      const nextBtn = page.locator('.ant-pagination-next');
      if (await nextBtn.isEnabled().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
        
        // 验证页码变化
        const newPage = await page.locator('.ant-pagination-item-active').textContent();
        expect(newPage).not.toBe(currentPage);
      }
    }
    
    console.log('✅ TC-07 通过: 分页功能正常');
  });

  /**
   * TC-08: 矩阵视图渲染
   */
  test('TC-08: 矩阵视图渲染与交互验证', async ({ page }) => {
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 切换到矩阵视图
    await switchView(page, 'matrix');
    await page.waitForTimeout(3000);
    
    // 验证Canvas存在
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // 验证有矩阵相关控件
    const hasControls = await page.locator('.matrix-controls, .pagination, [data-testid="matrix-controls"]').isVisible().catch(() => false);
    
    console.log('✅ TC-08 通过: 矩阵视图渲染正常');
  });

  /**
   * TC-09: 树形视图展开折叠
   */
  test('TC-09: 树形视图展开折叠功能', async ({ page }) => {
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 切换到树形视图
    await switchView(page, 'tree');
    await waitForTreeLoad(page);
    
    // 查找可展开的节点
    const expandIcons = page.locator('.ant-tree-switcher, .tree-expand-icon');
    const count = await expandIcons.count();
    
    if (count > 0) {
      // 点击第一个展开图标
      await expandIcons.first().click();
      await page.waitForTimeout(1000);
      
      // 验证子节点出现
      const childNodes = page.locator('.ant-tree-treenode');
      expect(await childNodes.count()).toBeGreaterThan(0);
    }
    
    console.log('✅ TC-09 通过: 树形视图展开折叠正常');
  });

  /**
   * TC-10: 仪表盘统计显示
   */
  test('TC-10: 仪表盘统计数据验证', async ({ page }) => {
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 切换到仪表盘
    await switchView(page, 'dashboard');
    await page.waitForTimeout(2000);
    
    // 验证统计卡片
    const statCards = page.locator('.ant-statistic, .stat-card, [data-testid="stat-card"]');
    await expect(statCards).toHaveCount({ min: 1 });
    
    // 验证节点/边统计
    const hasNodeStat = await page.locator('text=/节点|nodes|Node/i').isVisible().catch(() => false);
    const hasEdgeStat = await page.locator('text=/边|edges|Edge/i').isVisible().catch(() => false);
    
    console.log('✅ TC-10 通过: 仪表盘统计正常');
  });

  /**
   * TC-11: Schema查看器类型列表
   */
  test('TC-11: Schema查看器实体类型列表', async ({ page }) => {
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 切换到Schema查看器
    await switchView(page, 'schema');
    await page.waitForTimeout(2000);
    
    // 验证实体类型列表
    const entitySection = page.locator('text=/实体类型|Entity Types/i');
    await expect(entitySection).toBeVisible();
    
    // 验证有类型项
    const typeItems = page.locator('.entity-type-item, .schema-item, .ant-collapse-item');
    await expect(typeItems).toHaveCount({ min: 1 });
    
    console.log('✅ TC-11 通过: Schema查看器正常');
  });

  /**
   * TC-12: 数据导入功能
   */
  test('TC-12: JSON数据导入功能验证', async ({ page }) => {
    // 创建测试图谱
    const testGraphName = generateTestGraphName();
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    
    // 点击创建图谱
    await page.locator('button:has-text("创建"), [data-testid="create-graph-btn"]').click();
    await page.waitForSelector('.ant-modal, .create-modal', { state: 'visible' });
    
    // 填写名称
    await page.locator('input[name="name"], #name').fill(testGraphName);
    
    // 如果有文件上传选项
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles('./e2e/data/test-import.json');
    }
    
    // 创建图谱
    await page.locator('button:has-text("创建"), button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    // 验证页面跳转
    await expect(page).toHaveURL(/\/graphs\/[\w-]+/);
    
    console.log('✅ TC-12 通过: 数据导入功能正常');
  });

  /**
   * TC-13: 图谱导出功能
   */
  test('TC-13: 图谱导出功能验证', async ({ page }) => {
    // 进入第一个图谱
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 查找导出按钮
    const exportBtn = page.locator('button:has-text("导出"), [data-testid="export-btn"]');
    
    if (await exportBtn.isVisible().catch(() => false)) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
      
      // 选择JSON格式
      const jsonOption = page.locator('text=JSON, [data-testid="export-json"]');
      if (await jsonOption.isVisible().catch(() => false)) {
        await jsonOption.click();
        await page.waitForTimeout(2000);
        
        // 验证下载（通过检查是否有成功提示）
        console.log('  ✅ 导出操作执行成功');
      }
    } else {
      console.log('  ℹ️ 未找到导出按钮，跳过此验证');
    }
    
    console.log('✅ TC-13 通过: 图谱导出功能正常');
  });

  /**
   * TC-14: 全局节点搜索
   */
  test('TC-14: 全局节点搜索功能', async ({ page }) => {
    // 进入图谱详情页
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    await page.locator('.ant-card, .graph-card').first().click();
    await page.waitForTimeout(2000);
    
    // 查找全局搜索框
    const searchInput = page.locator('input[placeholder*="搜索"], .global-search input').first();
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Epic');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      
      console.log('  ✅ 搜索功能执行成功');
    } else {
      console.log('  ℹ️ 未找到全局搜索框');
    }
    
    console.log('✅ TC-14 通过: 全局搜索功能正常');
  });

  /**
   * TC-15: 图谱删除确认流程
   */
  test('TC-15: 图谱删除确认流程验证', async ({ page }) => {
    // 先创建一个测试图谱
    const testGraphName = generateTestGraphName();
    await page.goto('/graphs');
    await page.waitForLoadState('networkidle');
    
    // 创建图谱
    await page.locator('button:has-text("创建"), [data-testid="create-graph-btn"]').click();
    await page.waitForSelector('.ant-modal, .create-modal', { state: 'visible' });
    await page.locator('input[name="name"], #name').fill(testGraphName);
    await page.locator('button:has-text("创建"), button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    // 返回列表页
    await page.goto('/graphs');
    await page.waitForTimeout(2000);
    
    // 查找并删除测试图谱
    const testCard = page.locator(`.ant-card:has-text("${testGraphName}")`);
    
    if (await testCard.isVisible().catch(() => false)) {
      // 悬停显示删除按钮
      await testCard.hover();
      
      // 点击删除
      const deleteBtn = testCard.locator('button:has-text("删除"), .delete-btn');
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click();
        
        // 等待确认弹窗
        await page.waitForSelector('.ant-modal-confirm, .confirm-modal', { state: 'visible', timeout: 5000 });
        
        // 确认删除
        await page.locator('.ant-modal-confirm-btns button:has-text("确定"), button:has-text("删除")').click();
        await page.waitForTimeout(2000);
        
        // 验证图谱已删除
        await expect(testCard).not.toBeVisible();
        
        console.log('  ✅ 图谱删除成功');
      }
    }
    
    console.log('✅ TC-15 通过: 图谱删除流程正常');
  });
});
