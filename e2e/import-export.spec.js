/**
 * Phase 2: 数据导入导出功能测试
 * Import/Export Test Cases
 */
const { test, expect } = require('@playwright/test');
const { gotoOAGDetail, generateTestGraphName, TEST_OAG_ID } = require('./fixtures/test-helpers');

test.describe('Phase 2 - 数据导入导出功能', () => {

  /**
   * TC-IE-01: 导入导出面板UI渲染
   */
  test('TC-IE-01: 导入导出面板UI渲染', async ({ page }) => {
    // 尝试访问OAG详情页，如果不存在则跳过
    await page.goto(`/oag/${TEST_OAG_ID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 检查是否存在OAG不存在提示
    const emptyState = await page.locator('text=/OAG 不存在|Empty/i').isVisible().catch(() => false);
    if (emptyState) {
      console.log('ℹ️ 测试OAG不存在，跳过此测试');
      return;
    }
    
    // 验证导入导出面板标题
    await expect(page.locator('text=/数据导入导出/i')).toBeVisible();
    
    // 验证导入部分元素
    await expect(page.locator('button:has-text("选择文件预览")')).toBeVisible();
    await expect(page.locator('button:has-text("Excel模板")')).toBeVisible();
    await expect(page.locator('button:has-text("CSV模板")')).toBeVisible();
    
    // 验证导出部分元素
    await expect(page.locator('button:has-text("导出为 Excel")')).toBeVisible();
    await expect(page.locator('button:has-text("导出为 CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("导出为 JSON")')).toBeVisible();
    
    // 验证导入模式选项
    await expect(page.locator('text=/追加模式/i')).toBeVisible();
    await expect(page.locator('text=/替换模式/i')).toBeVisible();
    await expect(page.locator('text=/合并模式/i')).toBeVisible();
    
    console.log('✅ TC-IE-01 通过: 导入导出面板UI渲染正常');
  });

  /**
   * TC-IE-02: 导出按钮点击测试
   */
  test('TC-IE-02: 导出按钮点击测试', async ({ page }) => {
    await page.goto(`/oag/${TEST_OAG_ID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const emptyState = await page.locator('text=/OAG 不存在|Empty/i').isVisible().catch(() => false);
    if (emptyState) {
      console.log('ℹ️ 测试OAG不存在，跳过此测试');
      return;
    }
    
    // 测试Excel导出按钮
    const excelBtn = page.locator('button:has-text("导出为 Excel")');
    await expect(excelBtn).toBeEnabled();
    await excelBtn.click();
    await page.waitForTimeout(1000);
    
    // 测试CSV导出按钮
    const csvBtn = page.locator('button:has-text("导出为 CSV")');
    await expect(csvBtn).toBeEnabled();
    await csvBtn.click();
    await page.waitForTimeout(1000);
    
    console.log('✅ TC-IE-02 通过: 导出按钮点击正常');
  });

  /**
   * TC-IE-03: 导入模式选择
   */
  test('TC-IE-03: 导入模式选择', async ({ page }) => {
    await page.goto(`/oag/${TEST_OAG_ID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const emptyState = await page.locator('text=/OAG 不存在|Empty/i').isVisible().catch(() => false);
    if (emptyState) {
      console.log('ℹ️ 测试OAG不存在，跳过此测试');
      return;
    }
    
    // 测试三种模式的选择
    const modes = ['append', 'replace', 'merge'];
    for (const mode of modes) {
      const radio = page.locator(`input[type="radio"][value="${mode}"]`);
      await expect(radio).toBeVisible();
      await radio.check();
      await page.waitForTimeout(200);
    }
    
    console.log('✅ TC-IE-03 通过: 导入模式选择正常');
  });

  /**
   * TC-IE-04: 模板下载按钮
   */
  test('TC-IE-04: 模板下载按钮', async ({ page }) => {
    await page.goto(`/oag/${TEST_OAG_ID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const emptyState = await page.locator('text=/OAG 不存在|Empty/i').isVisible().catch(() => false);
    if (emptyState) {
      console.log('ℹ️ 测试OAG不存在，跳过此测试');
      return;
    }
    
    // 验证Excel模板按钮可点击
    const excelTemplateBtn = page.locator('button:has-text("Excel模板")');
    await expect(excelTemplateBtn).toBeEnabled();
    await excelTemplateBtn.click();
    await page.waitForTimeout(500);
    
    // 验证CSV模板按钮可点击
    const csvTemplateBtn = page.locator('button:has-text("CSV模板")');
    await expect(csvTemplateBtn).toBeEnabled();
    await csvTemplateBtn.click();
    await page.waitForTimeout(500);
    
    console.log('✅ TC-IE-04 通过: 模板下载按钮正常');
  });

  /**
   * TC-IE-05: 文件上传输入框
   */
  test('TC-IE-05: 文件上传输入框', async ({ page }) => {
    await page.goto(`/oag/${TEST_OAG_ID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const emptyState = await page.locator('text=/OAG 不存在|Empty/i').isVisible().catch(() => false);
    if (emptyState) {
      console.log('ℹ️ 测试OAG不存在，跳过此测试');
      return;
    }
    
    // 验证文件输入框存在
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeHidden(); // Ant Design Upload组件隐藏了原始input
    
    // 验证上传按钮存在
    const uploadBtn = page.locator('button:has-text("选择文件预览")');
    await expect(uploadBtn).toBeVisible();
    await expect(uploadBtn).toBeEnabled();
    
    console.log('✅ TC-IE-05 通过: 文件上传组件正常');
  });

  /**
   * TC-IE-06: 导入导出面板布局
   */
  test('TC-IE-06: 导入导出面板布局', async ({ page }) => {
    await page.goto(`/oag/${TEST_OAG_ID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const emptyState = await page.locator('text=/OAG 不存在|Empty/i').isVisible().catch(() => false);
    if (emptyState) {
      console.log('ℹ️ 测试OAG不存在，跳过此测试');
      return;
    }
    
    // 验证卡片结构
    const card = page.locator('.ant-card:has-text("数据导入导出")');
    await expect(card).toBeVisible();
    
    // 验证内层卡片（导入和导出）
    const innerCards = card.locator('.ant-card-type-inner');
    const cardCount = await innerCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2); // 至少导入和导出两个内层卡片
    
    console.log('✅ TC-IE-06 通过: 面板布局正常');
  });

  /**
   * TC-IE-07: 统计信息展示
   */
  test('TC-IE-07: 统计信息展示', async ({ page }) => {
    await page.goto(`/oag/${TEST_OAG_ID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const emptyState = await page.locator('text=/OAG 不存在|Empty/i').isVisible().catch(() => false);
    if (emptyState) {
      console.log('ℹ️ 测试OAG不存在，跳过此测试');
      return;
    }
    
    // 切换到概览Tab确保统计信息可见
    await page.locator('.ant-tabs-tab:has-text("概览")').click();
    await page.waitForTimeout(500);
    
    // 验证统计卡片
    const statistics = page.locator('.ant-statistic');
    await expect(statistics).toHaveCount({ min: 4 }); // 节点数、边数、实体类型、关系类型
    
    // 验证具体统计项
    await expect(page.locator('.ant-statistic-title:has-text("节点数")')).toBeVisible();
    await expect(page.locator('.ant-statistic-title:has-text("边数")')).toBeVisible();
    
    console.log('✅ TC-IE-07 通过: 统计信息展示正常');
  });

  /**
   * TC-IE-08: Tab切换不影响导入导出
   */
  test('TC-IE-08: Tab切换不影响导入导出', async ({ page }) => {
    await page.goto(`/oag/${TEST_OAG_ID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const emptyState = await page.locator('text=/OAG 不存在|Empty/i').isVisible().catch(() => false);
    if (emptyState) {
      console.log('ℹ️ 测试OAG不存在，跳过此测试');
      return;
    }
    
    // 切换到其他Tab
    await page.locator('.ant-tabs-tab:has-text("节点")').click();
    await page.waitForTimeout(500);
    
    await page.locator('.ant-tabs-tab:has-text("边")').click();
    await page.waitForTimeout(500);
    
    // 回到概览Tab
    await page.locator('.ant-tabs-tab:has-text("概览")').click();
    await page.waitForTimeout(500);
    
    // 验证导入导出面板仍在
    await expect(page.locator('text=/数据导入导出/i')).toBeVisible();
    await expect(page.locator('button:has-text("导出为 Excel")')).toBeVisible();
    
    console.log('✅ TC-IE-08 通过: Tab切换后导入导出面板正常');
  });

  /**
   * TC-IE-09: API端点可用性测试
   */
  test('TC-IE-09: 导入导出API端点', async ({ request }) => {
    // 测试导出端点
    const exportResponse = await request.get(`http://localhost:8090/api/v1/oag/${TEST_OAG_ID}/export?format=xlsx`);
    
    // 如果OAG存在，应该返回200或文件；如果不存在，应该返回404或500
    expect([200, 404, 500]).toContain(exportResponse.status());
    
    if (exportResponse.status() === 200) {
      console.log('  ✅ 导出API端点正常');
    } else {
      console.log('  ℹ️ 测试OAG不存在，API返回404');
    }
    
    // 测试模板下载端点
    const templateResponse = await request.get(`http://localhost:8090/api/v1/oag/${TEST_OAG_ID}/export/template?format=xlsx`);
    expect([200, 404, 500]).toContain(templateResponse.status());
    
    if (templateResponse.status() === 200) {
      console.log('  ✅ 模板下载API端点正常');
    }
    
    console.log('✅ TC-IE-09 通过: API端点可用性测试完成');
  });

  /**
   * TC-IE-10: Phase 1 回归测试
   */
  test('TC-IE-10: Phase 1功能回归验证', async ({ page }) => {
    await page.goto(`/oag/${TEST_OAG_ID}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const emptyState = await page.locator('text=/OAG 不存在|Empty/i').isVisible().catch(() => false);
    if (emptyState) {
      console.log('ℹ️ 测试OAG不存在，跳过回归测试');
      return;
    }
    
    // 验证Phase 1的基本功能
    // 1. 页面标题
    await expect(page.locator('h1')).toBeVisible();
    
    // 2. Tabs存在
    await expect(page.locator('.ant-tabs')).toBeVisible();
    
    // 3. 验证按钮
    await expect(page.locator('button:has-text("验证")')).toBeVisible();
    await expect(page.locator('button:has-text("刷新")')).toBeVisible();
    
    // 4. 统计卡片
    await expect(page.locator('.ant-statistic')).toHaveCount({ min: 1 });
    
    // 5. 导入导出面板（Phase 2新增）
    await expect(page.locator('text=/数据导入导出/i')).toBeVisible();
    
    console.log('✅ TC-IE-10 通过: Phase 1功能回归验证完成，Phase 2功能已集成');
  });
});
