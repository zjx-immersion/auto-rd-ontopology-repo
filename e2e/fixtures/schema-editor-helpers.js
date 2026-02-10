/**
 * Schema Editor 测试辅助函数
 */

/**
 * 创建测试实体类型
 * @param {Page} page - Playwright page 对象
 * @param {Object} options - 配置选项
 * @returns {Promise<Locator>} 创建的实体节点
 */
async function createTestEntity(page, options = {}) {
  const {
    x = 400,
    y = 300,
    name = '测试实体',
    description = '测试描述',
    color = null,
  } = options;

  // 点击添加实体按钮（第二个按钮）
  const addEntityBtn = page.locator('.tool-panel button').nth(1);
  await addEntityBtn.click();

  // 点击画布
  const canvas = page.locator('.react-flow__pane');
  await canvas.click({ position: { x, y } });

  // 等待创建完成
  await page.waitForTimeout(300);

  // 获取刚创建的节点
  const entityNode = page.locator('.entity-type-node').last();

  // 填写属性
  if (name || description || color) {
    await entityNode.click();

    if (name) {
      const nameInput = page.locator('.property-panel input').first();
      await nameInput.fill(name);
    }

    if (description) {
      const descInput = page.locator('.property-panel textarea').first();
      await descInput.fill(description);
    }

    // 保存
    await page.click('.property-panel button:has-text("保存")');
    await page.waitForTimeout(200);
  }

  return entityNode;
}

/**
 * 创建测试关系类型
 * @param {Page} page - Playwright page 对象
 * @param {Object} options - 配置选项
 */
async function createTestRelation(page, options = {}) {
  const {
    sourceIndex = 0,
    targetIndex = 1,
    name = '测试关系',
    description = '测试关系描述',
  } = options;

  // 点击添加关系按钮
  const addRelationBtn = page.locator('.tool-panel button').nth(2);
  await addRelationBtn.click();

  // 获取源和目标节点
  const sourceNode = page.locator('.entity-type-node').nth(sourceIndex);
  const targetNode = page.locator('.entity-type-node').nth(targetIndex);

  const sourceBox = await sourceNode.boundingBox();
  const targetBox = await targetNode.boundingBox();

  // 拖拽连接
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y, { steps: 10 });
  await page.mouse.up();

  // 等待创建
  await page.waitForTimeout(500);

  // 填写属性
  if (name || description) {
    const nameInput = page.locator('.property-panel input').first();
    await nameInput.fill(name);

    if (description) {
      const descInput = page.locator('.property-panel textarea').first();
      await descInput.fill(description);
    }

    // 保存
    await page.click('.property-panel button:has-text("保存")');
    await page.waitForTimeout(200);
  }
}

/**
 * 为实体添加属性
 * @param {Page} page - Playwright page 对象
 * @param {Object} property - 属性定义
 */
async function addPropertyToEntity(page, property) {
  const {
    name,
    label,
    type = 'String',
    required = false,
  } = property;

  // 填写属性表单
  await page.fill('.property-panel input[placeholder*="属性名"]', name);
  await page.fill('.property-panel input[placeholder*="属性标签"]', label);
  await page.selectOption('.property-panel .ant-select', type);

  if (required) {
    await page.click('.property-panel .ant-switch');
  }

  // 添加属性
  await page.click('.property-panel button:has-text("添加属性")');
  await page.waitForTimeout(200);
}

/**
 * 获取画布上的所有实体节点
 * @param {Page} page - Playwright page 对象
 * @returns {Promise<Array<Locator>>} 实体节点数组
 */
async function getAllEntities(page) {
  return page.locator('.entity-type-node').all();
}

/**
 * 获取画布上的所有关系边
 * @param {Page} page - Playwright page 对象
 * @returns {Promise<Array<Locator>>} 关系边数组
 */
async function getAllRelations(page) {
  return page.locator('.react-flow__edge').all();
}

/**
 * 清空画布（删除所有实体）
 * @param {Page} page - Playwright page 对象
 */
async function clearCanvas(page) {
  const entities = await getAllEntities(page);

  for (const entity of entities) {
    await entity.click();
    await page.click('.property-panel button:has-text("删除")');
    await page.click('.ant-popconfirm-buttons button:has-text("删除")');
    await page.waitForTimeout(200);
  }
}

/**
 * 等待消息提示
 * @param {Page} page - Playwright page 对象
 * @param {string} text - 消息文本
 * @param {number} timeout - 超时时间
 */
async function waitForMessage(page, text, timeout = 5000) {
  await expect(page.locator('.ant-message')).toContainText(text, { timeout });
}

/**
 * 验证实体存在
 * @param {Page} page - Playwright page 对象
 * @param {string} name - 实体名称
 */
async function assertEntityExists(page, name) {
  const entity = page.locator('.entity-type-node').filter({ hasText: name });
  await expect(entity).toBeVisible();
  return entity;
}

/**
 * 验证实体不存在
 * @param {Page} page - Playwright page 对象
 * @param {string} name - 实体名称
 */
async function assertEntityNotExists(page, name) {
  const entity = page.locator('.entity-type-node').filter({ hasText: name });
  await expect(entity).not.toBeVisible();
}

module.exports = {
  createTestEntity,
  createTestRelation,
  addPropertyToEntity,
  getAllEntities,
  getAllRelations,
  clearCanvas,
  waitForMessage,
  assertEntityExists,
  assertEntityNotExists,
};
