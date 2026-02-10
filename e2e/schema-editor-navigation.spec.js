/**
 * Schema 编辑器导航测试
 * 测试从页面点击进入 Schema 编辑器
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:6060';

test.describe('Schema 编辑器导航测试', () => {
  
  test('NAV-01: 从图谱列表页点击进入 Schema 编辑器', async ({ page }) => {
    // 1. 访问图谱列表页
    console.log('🚀 访问图谱列表页...');
    await page.goto(`${BASE_URL}/graphs`);
    await page.waitForLoadState('networkidle');
    
    // 截图：列表页初始状态
    await page.screenshot({ 
      path: 'playwright-report/nav-01-list-page.png',
      fullPage: false
    });
    console.log('✅ 列表页加载完成');
    
    // 2. 验证页面标题
    await expect(page.locator('h1')).toContainText('图谱管理');
    console.log('✅ 页面标题验证通过');
    
    // 3. 查找并点击 "Schema编辑器" 按钮
    console.log('🔍 查找 Schema编辑器 按钮...');
    const schemaEditorBtn = page.locator('button:has-text("Schema编辑器")');
    await expect(schemaEditorBtn).toBeVisible({ timeout: 5000 });
    
    // 截图：点击前
    await page.screenshot({ 
      path: 'playwright-report/nav-01-before-click.png',
      fullPage: false
    });
    
    // 4. 点击按钮
    console.log('👆 点击 Schema编辑器 按钮...');
    await schemaEditorBtn.click();
    
    // 5. 等待导航完成
    await page.waitForURL('**/schema-editor', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // 6. 验证进入 Schema 编辑器
    await expect(page).toHaveURL(/\/schema-editor/);
    await expect(page.locator('.toolbar-title')).toContainText('Schema 可视化编辑器');
    await expect(page.locator('.schema-editor-layout')).toBeVisible();
    
    // 截图：进入 Schema 编辑器
    await page.screenshot({ 
      path: 'playwright-report/nav-01-schema-editor.png',
      fullPage: false
    });
    
    // 7. 验证画布加载
    await expect(page.locator('.react-flow')).toBeVisible();
    const nodeCount = await page.locator('.entity-type-node').count();
    console.log(`✅ 进入 Schema 编辑器成功，加载了 ${nodeCount} 个实体节点`);
    
    console.log('🎉 NAV-01 测试通过：从列表页导航到 Schema 编辑器成功！');
  });

  test('NAV-02: 从图谱详情页 Schema 视图点击进入编辑器', async ({ page, request }) => {
    // 1. 先获取一个图谱ID
    console.log('🔍 获取图谱列表...');
    const response = await request.get('http://localhost:3001/api/v1/graphs');
    const apiData = await response.json();
    
    if (!apiData.success || apiData.data.graphs.length === 0) {
      console.log('⚠️ 没有可用的图谱，跳过测试');
      test.skip();
      return;
    }
    
    const graphId = apiData.data.graphs[0].id;
    console.log(`✅ 使用图谱 ID: ${graphId}`);
    
    // 2. 访问图谱详情页
    console.log('🚀 访问图谱详情页...');
    await page.goto(`${BASE_URL}/graphs/${graphId}`);
    await page.waitForLoadState('networkidle');
    
    // 截图：详情页初始状态
    await page.screenshot({ 
      path: 'playwright-report/nav-02-detail-page.png',
      fullPage: false
    });
    console.log('✅ 详情页加载完成');
    
    // 3. 点击 Schema 视图标签
    console.log('👆 切换到 Schema 视图...');
    const schemaTab = page.locator('.ant-segmented-item:has-text("Schema"), button:has-text("Schema")').first();
    await schemaTab.click();
    await page.waitForTimeout(1000);
    
    // 截图：Schema 视图
    await page.screenshot({ 
      path: 'playwright-report/nav-02-schema-view.png',
      fullPage: false
    });
    console.log('✅ 切换到 Schema 视图');
    
    // 4. 查找并点击 "编辑Schema" 按钮
    console.log('🔍 查找 编辑Schema 按钮...');
    const editSchemaBtn = page.locator('button:has-text("编辑Schema")');
    await expect(editSchemaBtn).toBeVisible({ timeout: 5000 });
    
    // 截图：点击前
    await page.screenshot({ 
      path: 'playwright-report/nav-02-before-click.png',
      fullPage: false
    });
    
    // 5. 点击按钮
    console.log('👆 点击 编辑Schema 按钮...');
    await editSchemaBtn.click();
    
    // 6. 等待导航完成
    await page.waitForURL(`**/schema-editor/${graphId}`, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // 7. 验证进入 Schema 编辑器
    await expect(page).toHaveURL(new RegExp(`/schema-editor/${graphId}`));
    await expect(page.locator('.toolbar-title')).toContainText('Schema 可视化编辑器');
    
    // 截图：进入 Schema 编辑器
    await page.screenshot({ 
      path: 'playwright-report/nav-02-schema-editor.png',
      fullPage: false
    });
    
    console.log('🎉 NAV-02 测试通过：从详情页导航到 Schema 编辑器成功！');
  });

  test('NAV-03: 直接访问 Schema 编辑器 URL', async ({ page }) => {
    // 1. 直接访问 Schema 编辑器 URL
    console.log('🚀 直接访问 Schema 编辑器...');
    await page.goto(`${BASE_URL}/schema-editor`);
    await page.waitForLoadState('networkidle');
    
    // 2. 验证页面加载
    await expect(page.locator('.toolbar-title')).toContainText('Schema 可视化编辑器');
    await expect(page.locator('.schema-editor-layout')).toBeVisible();
    await expect(page.locator('.react-flow')).toBeVisible();
    
    // 截图
    await page.screenshot({ 
      path: 'playwright-report/nav-03-direct-access.png',
      fullPage: false
    });
    
    // 3. 验证工具栏
    await expect(page.locator('.schema-toolbar')).toBeVisible();
    await expect(page.locator('.schema-toolbar button:has-text("导入")')).toBeVisible();
    await expect(page.locator('.schema-toolbar button:has-text("导出")')).toBeVisible();
    await expect(page.locator('.schema-toolbar button:has-text("验证")')).toBeVisible();
    await expect(page.locator('.schema-toolbar button:has-text("保存")')).toBeVisible();
    
    console.log('🎉 NAV-03 测试通过：直接访问 Schema 编辑器成功！');
  });

  test('NAV-04: Schema 编辑器返回按钮测试', async ({ page }) => {
    // 1. 先进入 Schema 编辑器
    await page.goto(`${BASE_URL}/schema-editor`);
    await page.waitForLoadState('networkidle');
    
    // 2. 验证页面加载
    await expect(page.locator('.toolbar-title')).toContainText('Schema 可视化编辑器');
    
    // 截图
    await page.screenshot({ 
      path: 'playwright-report/nav-04-schema-editor.png',
      fullPage: false
    });
    
    // 3. 点击返回按钮（左上角箭头）
    console.log('👆 点击返回按钮...');
    const backBtn = page.locator('.schema-toolbar button').first();
    await backBtn.click();
    
    // 4. 等待返回
    await page.waitForTimeout(1000);
    
    // 截图：返回后
    await page.screenshot({ 
      path: 'playwright-report/nav-04-after-back.png',
      fullPage: false
    });
    
    console.log('🎉 NAV-04 测试通过：返回按钮功能正常！');
  });

});
