/**
 * 环境检查测试
 */
const { test, expect } = require('@playwright/test');

test.describe('环境检查', () => {
  
  test('后端API服务可访问', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
    console.log('✅ 后端服务正常');
  });
  
  test('后端API返回图谱列表', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/graphs');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.graphs.length).toBeGreaterThan(0);
    console.log(`✅ 发现 ${body.data.graphs.length} 个图谱`);
  });
  
  test('前端服务可访问', async ({ page }) => {
    await page.goto('http://localhost:6060');
    await expect(page).toHaveTitle(/本体图谱|知识图谱|Ontology/i);
    console.log('✅ 前端服务正常');
  });
  
  test('前端页面加载完成', async ({ page }) => {
    await page.goto('http://localhost:6060');
    await page.waitForLoadState('networkidle');
    
    // 截图查看页面状态
    await page.screenshot({ path: 'playwright-report/env-check.png' });
    
    // 检查页面是否有内容
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(0);
    
    console.log('✅ 前端页面加载完成');
  });
});
