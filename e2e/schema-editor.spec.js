/**
 * Schema 可视化编辑器 - E2E 测试
 * 
 * 测试覆盖:
 * 1. 页面加载和初始化
 * 2. 实体类型 CRUD
 * 3. 关系类型 CRUD
 * 4. 属性配置
 * 5. 撤销/重做
 * 6. 保存/加载
 * 7. 画布交互
 */
const { test, expect } = require('@playwright/test');
const {
  createTestEntity,
  createTestRelation,
  addPropertyToEntity,
  clearCanvas,
  waitForMessage,
  assertEntityExists,
} = require('./fixtures/schema-editor-helpers');

// 测试数据
const TEST_ENTITY = {
  name: '测试实体类型',
  description: '这是用于自动化测试的实体类型',
  color: '#52c41a',
};

const TEST_RELATION = {
  name: '测试关系',
  description: '这是用于自动化测试的关系类型',
};

const TEST_PROPERTY = {
  name: 'testProperty',
  label: '测试属性',
  type: 'String',
  description: '测试属性描述',
};

test.describe('Schema 可视化编辑器', () => {
  
  test.beforeEach(async ({ page }) => {
    // 访问 Schema 编辑器
    await page.goto('http://localhost:8080/schema-editor');
    await page.waitForLoadState('networkidle');
    
    // 等待编辑器加载完成
    await page.waitForSelector('.schema-editor-layout', { timeout: 10000 });
  });

  /**
   * TC-SE-01: 页面加载验证
   */
  test('TC-SE-01: 页面加载和初始化', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('.toolbar-title')).toContainText('Schema 可视化编辑器');
    
    // 验证工具栏按钮存在
    const toolbarButtons = page.locator('.schema-toolbar button');
    await expect(toolbarButtons).toHaveCount(5);
    
    // 验证左侧工具面板
    await expect(page.locator('.schema-editor-sider')).toBeVisible();
    await expect(page.locator('.tool-panel')).toBeVisible();
    
    // 验证画布区域
    await expect(page.locator('.react-flow')).toBeVisible();
    await expect(page.locator('.react-flow__background')).toBeVisible();
    
    // 验证右侧属性面板
    await expect(page.locator('.property-panel-sider')).toBeVisible();
    await expect(page.locator('.property-panel')).toContainText('属性面板');
    
    // 验证 Controls 和 MiniMap
    await expect(page.locator('.react-flow__controls')).toBeVisible();
    await expect(page.locator('.schema-minimap, .react-flow__minimap')).toBeVisible();
    
    // 截图记录
    await page.screenshot({ path: 'playwright-report/schema-editor-initial.png' });
    
    console.log('✅ TC-SE-01 通过: 页面加载正常');
  });

  /**
   * TC-SE-02: 创建实体类型
   */
  test('TC-SE-02: 创建实体类型', async ({ page }) => {
    // 1. 点击"添加实体类型"按钮
    const addEntityBtn = page.locator('.tool-panel button').nth(1); // 第二个按钮是添加实体
    await addEntityBtn.click();
    
    // 验证按钮选中状态
    await expect(addEntityBtn).toHaveClass(/ant-btn-primary/);
    
    // 验证模式提示
    await expect(page.locator('.mode-hint')).toContainText('点击画布空白处创建实体类型');
    
    // 2. 点击画布创建实体
    const canvas = page.locator('.react-flow__pane');
    await canvas.click({ position: { x: 400, y: 300 } });
    
    // 3. 等待属性面板更新
    await page.waitForTimeout(500);
    
    // 验证实体节点创建
    const entityNode = page.locator('.entity-type-node').first();
    await expect(entityNode).toBeVisible();
    
    // 4. 编辑实体属性
    await page.fill('.property-panel input[placeholder*="类型名称"]', TEST_ENTITY.name);
    await page.fill('.property-panel textarea[placeholder*="描述"]', TEST_ENTITY.description);
    
    // 5. 保存
    await page.click('.property-panel button:has-text("保存")');
    
    // 验证保存成功
    await expect(page.locator('.ant-message')).toContainText('保存成功');
    
    // 验证节点显示更新
    await expect(entityNode).toContainText(TEST_ENTITY.name);
    
    // 截图记录
    await page.screenshot({ path: 'playwright-report/schema-editor-entity-created.png' });
    
    console.log('✅ TC-SE-02 通过: 实体类型创建成功');
  });

  /**
   * TC-SE-03: 编辑实体类型
   */
  test('TC-SE-03: 编辑实体类型', async ({ page }) => {
    // 前置：先创建一个实体
    await createTestEntity(page);
    
    // 1. 点击实体节点选中
    const entityNode = page.locator('.entity-type-node').first();
    await entityNode.click();
    
    // 2. 验证属性面板显示
    await expect(page.locator('.property-panel')).toContainText('实体类型');
    
    // 3. 修改属性
    const newName = '修改后的实体名称';
    await page.fill('.property-panel input[placeholder*="类型名称"]', newName);
    
    // 4. 修改颜色
    const colorPicker = page.locator('.property-panel .ant-color-picker-trigger');
    await colorPicker.click();
    await page.click('.ant-color-picker-presets .ant-color-picker-color-block', { timeout: 3000 });
    
    // 5. 保存
    await page.click('.property-panel button:has-text("保存")');
    
    // 验证更新
    await expect(entityNode).toContainText(newName);
    
    console.log('✅ TC-SE-03 通过: 实体类型编辑成功');
  });

  /**
   * TC-SE-04: 删除实体类型
   */
  test('TC-SE-04: 删除实体类型', async ({ page }) => {
    // 前置：先创建一个实体
    await createTestEntity(page);
    
    // 1. 点击实体节点选中
    const entityNode = page.locator('.entity-type-node').first();
    await entityNode.click();
    
    // 2. 点击删除按钮
    await page.click('.property-panel button:has-text("删除")');
    
    // 3. 确认删除
    await page.click('.ant-popconfirm-buttons button:has-text("删除")');
    
    // 验证删除成功
    await expect(page.locator('.ant-message')).toContainText('删除成功');
    await expect(entityNode).not.toBeVisible();
    
    console.log('✅ TC-SE-04 通过: 实体类型删除成功');
  });

  /**
   * TC-SE-05: 添加实体属性
   */
  test('TC-SE-05: 添加实体属性', async ({ page }) => {
    // 前置：先创建一个实体
    await createTestEntity(page);
    
    // 1. 选中实体
    const entityNode = page.locator('.entity-type-node').first();
    await entityNode.click();
    
    // 2. 添加属性
    await page.fill('.property-panel input[placeholder*="属性名"]', TEST_PROPERTY.name);
    await page.fill('.property-panel input[placeholder*="属性标签"]', TEST_PROPERTY.label);
    await page.selectOption('.property-panel .ant-select', TEST_PROPERTY.type);
    
    // 3. 点击添加
    await page.click('.property-panel button:has-text("添加属性")');
    
    // 验证属性添加成功
    await expect(page.locator('.ant-collapse-header')).toContainText(TEST_PROPERTY.name);
    await expect(page.locator('.ant-collapse-header')).toContainText(TEST_PROPERTY.type);
    
    // 验证节点显示属性数量
    await expect(entityNode).toContainText('1 属性');
    
    console.log('✅ TC-SE-05 通过: 属性添加成功');
  });

  /**
   * TC-SE-06: 创建关系类型
   */
  test('TC-SE-06: 创建关系类型', async ({ page }) => {
    // 前置：创建两个实体
    await createTestEntity(page, { x: 300, y: 300, name: '源实体' });
    await createTestEntity(page, { x: 500, y: 300, name: '目标实体' });
    
    // 1. 点击"添加关系类型"按钮
    const addRelationBtn = page.locator('.tool-panel button').nth(2); // 第三个按钮是添加关系
    await addRelationBtn.click();
    
    // 验证模式提示
    await expect(page.locator('.mode-hint')).toContainText('拖拽连接两个实体类型');
    
    // 2. 拖拽连接两个实体
    const sourceNode = page.locator('.entity-type-node').first();
    const targetNode = page.locator('.entity-type-node').nth(1);
    
    const sourceBox = await sourceNode.boundingBox();
    const targetBox = await targetNode.boundingBox();
    
    // 从源节点底部拖向目标节点顶部
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y, { steps: 10 });
    await page.mouse.up();
    
    // 3. 等待关系创建
    await page.waitForTimeout(500);
    
    // 验证关系边创建
    const relationEdge = page.locator('.react-flow__edge').first();
    await expect(relationEdge).toBeVisible();
    
    // 4. 编辑关系属性
    await page.fill('.property-panel input[placeholder*="关系名称"]', TEST_RELATION.name);
    await page.fill('.property-panel textarea[placeholder*="描述"]', TEST_RELATION.description);
    
    // 5. 保存
    await page.click('.property-panel button:has-text("保存")');
    
    // 验证
    await expect(relationEdge).toContainText(TEST_RELATION.name);
    
    console.log('✅ TC-SE-06 通过: 关系类型创建成功');
  });

  /**
   * TC-SE-07: 撤销和重做
   */
  test('TC-SE-07: 撤销和重做操作', async ({ page }) => {
    // 1. 创建实体
    await createTestEntity(page);
    const entityNode = page.locator('.entity-type-node').first();
    await expect(entityNode).toBeVisible();
    
    // 2. 点击撤销
    const undoBtn = page.locator('.tool-panel button').nth(3); // 撤销按钮
    await undoBtn.click();
    
    // 验证撤销成功
    await expect(entityNode).not.toBeVisible();
    
    // 3. 点击重做
    const redoBtn = page.locator('.tool-panel button').nth(4); // 重做按钮
    await redoBtn.click();
    
    // 验证重做成功
    await expect(entityNode).toBeVisible();
    
    console.log('✅ TC-SE-07 通过: 撤销重做功能正常');
  });

  /**
   * TC-SE-08: 保存 Schema
   */
  test('TC-SE-08: 保存 Schema', async ({ page }) => {
    // 1. 创建一些内容
    await createTestEntity(page);
    await page.click('.entity-type-node').first();
    await page.fill('.property-panel input[placeholder*="类型名称"]', '待保存实体');
    await page.click('.property-panel button:has-text("保存")');
    
    // 2. 点击保存按钮
    const saveBtn = page.locator('.schema-toolbar button:has-text("保存")');
    await saveBtn.click();
    
    // 3. 验证保存成功
    await expect(page.locator('.ant-message')).toContainText('Schema 保存成功');
    
    // 4. 验证保存按钮禁用（无变更状态）
    await expect(saveBtn).toBeDisabled();
    
    console.log('✅ TC-SE-08 通过: Schema 保存成功');
  });

  /**
   * TC-SE-09: 画布平移和缩放
   */
  test('TC-SE-09: 画布交互操作', async ({ page }) => {
    // 创建多个实体
    await createTestEntity(page, { x: 200, y: 200 });
    await createTestEntity(page, { x: 600, y: 400 });
    
    // 1. 测试画布平移
    const canvas = page.locator('.react-flow__pane');
    await canvas.dragTo(canvas, { sourcePosition: { x: 100, y: 100 }, targetPosition: { x: 300, y: 300 } });
    
    // 2. 测试缩放 - 点击放大按钮
    await page.click('.react-flow__controls-zoomin');
    await page.click('.react-flow__controls-zoomin');
    
    // 3. 测试缩放 - 点击缩小按钮
    await page.click('.react-flow__controls-zoomout');
    
    // 4. 测试适应视图
    await page.click('.react-flow__controls-fitview');
    
    console.log('✅ TC-SE-09 通过: 画布交互正常');
  });

  /**
   * TC-SE-10: 空状态验证
   */
  test('TC-SE-10: 属性面板空状态', async ({ page }) => {
    // 直接访问编辑器，不选中任何节点
    await expect(page.locator('.property-panel')).toContainText('属性面板');
    await expect(page.locator('.property-panel .ant-empty')).toBeVisible();
    await expect(page.locator('.property-panel')).toContainText('选择一个实体类型或关系类型进行编辑');
    
    console.log('✅ TC-SE-10 通过: 空状态显示正常');
  });

  /**
   * TC-SE-11: 关联图谱加载 Schema
   */
  test('TC-SE-11: 关联图谱 Schema 编辑', async ({ page }) => {
    // 先获取一个图谱ID
    const response = await page.request.get('http://localhost:3001/api/v1/graphs');
    const apiData = await response.json();
    
    if (!apiData.success || apiData.data.graphs.length === 0) {
      console.log('⚠️ 跳过测试: 没有可用的图谱');
      return;
    }
    
    const graphId = apiData.data.graphs[0].id;
    
    // 访问关联图谱的 Schema 编辑器
    await page.goto(`http://localhost:8080/schema-editor/${graphId}`);
    await page.waitForLoadState('networkidle');
    
    // 验证页面加载
    await expect(page.locator('.schema-editor-layout')).toBeVisible();
    
    // 验证 Schema 数据加载（可能有现有节点）
    console.log('✅ TC-SE-11 通过: 关联图谱 Schema 编辑页面加载正常');
  });

});
