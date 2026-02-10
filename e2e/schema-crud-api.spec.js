/**
 * Schema CRUD API 测试
 * 测试实体类型和关系类型的增删改查 API
 * 
 * 测试覆盖:
 * - Entity Type CRUD: GET, POST, PUT, DELETE
 * - Relation Type CRUD: GET, POST, PUT, DELETE
 * - 错误处理: 404, 400, 409 等状态码
 * - 数据一致性验证
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3001';
const API_PREFIX = '/api/v1/graph';

test.describe('Schema CRUD API 测试', () => {
  
  // 测试数据
  const testEntityType = {
    code: `TestEntity_${Date.now()}`,
    label: '测试实体',
    description: '用于 API 测试的实体类型',
    domain: '测试域',
    properties: {
      name: { type: 'String', required: true, description: '名称' },
      status: { type: 'Enum', values: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
    },
    color: '#ff4d4f'
  };

  const testRelationType = {
    code: `TestRelation_${Date.now()}`,
    label: '测试关系',
    description: '用于 API 测试的关系类型',
    sourceType: 'Vehicle',
    targetType: 'DomainProject',
    properties: {
      weight: { type: 'Number', default: 1.0 }
    },
    directed: true
  };

  test.describe('Entity Type API', () => {

    test('API-01: 获取所有实体类型列表', async ({ request }) => {
      const response = await request.get(`${BASE_URL}${API_PREFIX}/schema/entity-types`);
      
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.count).toBeGreaterThan(0);
      
      // 验证返回的数据包含预期的实体类型
      expect(body.data.Vehicle).toBeDefined();
      expect(body.data.Vehicle.label).toBe('车型');
      
      console.log(`✅ 获取到 ${body.count} 个实体类型`);
    });

    test('API-02: 获取单个实体类型详情', async ({ request }) => {
      const response = await request.get(`${BASE_URL}${API_PREFIX}/schema/entity-types/Vehicle`);
      
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.code).toBe('Vehicle');
      expect(body.data.label).toBe('车型');
      expect(body.data.properties).toBeDefined();
      
      console.log('✅ 获取单个实体类型成功:', body.data.label);
    });

    test('API-03: 获取不存在的实体类型返回 404', async ({ request }) => {
      const response = await request.get(`${BASE_URL}${API_PREFIX}/schema/entity-types/NonExistent`);
      
      expect(response.status()).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('ENTITY_TYPE_NOT_FOUND');
      
      console.log('✅ 404 错误处理正确');
    });

    test('API-04: 创建新实体类型', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${API_PREFIX}/schema/entity-types`, {
        data: testEntityType
      });
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(201);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.code).toBe(testEntityType.code);
      expect(body.data.label).toBe(testEntityType.label);
      expect(body.data.createdAt).toBeDefined();
      
      console.log('✅ 创建实体类型成功:', body.data.code);
    });

    test('API-05: 创建重复的实体类型返回 400', async ({ request }) => {
      // 先创建
      await request.post(`${BASE_URL}${API_PREFIX}/schema/entity-types`, {
        data: testEntityType
      });
      
      // 再创建相同的应该失败
      const response = await request.post(`${BASE_URL}${API_PREFIX}/schema/entity-types`, {
        data: testEntityType
      });
      
      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('CREATE_ERROR');
      
      console.log('✅ 重复创建被拒绝');
    });

    test('API-06: 更新实体类型', async ({ request }) => {
      // 确保测试实体存在
      await request.post(`${BASE_URL}${API_PREFIX}/schema/entity-types`, {
        data: testEntityType
      });
      
      const updateData = {
        label: '测试实体(已更新)',
        description: '更新后的描述',
        color: '#52c41a'
      };
      
      const response = await request.put(`${BASE_URL}${API_PREFIX}/schema/entity-types/${testEntityType.code}`, {
        data: updateData
      });
      
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.label).toBe(updateData.label);
      expect(body.data.description).toBe(updateData.description);
      expect(body.data.color).toBe(updateData.color);
      expect(body.data.updatedAt).toBeDefined();
      
      console.log('✅ 更新实体类型成功');
    });

    test('API-07: 更新不存在的实体类型返回 404', async ({ request }) => {
      const response = await request.put(`${BASE_URL}${API_PREFIX}/schema/entity-types/NonExistent`, {
        data: { label: '不存在' }
      });
      
      expect(response.status()).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UPDATE_ERROR');
      
      console.log('✅ 更新不存在的实体类型返回 404');
    });

    test('API-08: 删除实体类型', async ({ request }) => {
      // 创建一个专门用于删除测试的实体
      const deleteTestEntity = {
        ...testEntityType,
        code: `DeleteTest_${Date.now()}`
      };
      
      await request.post(`${BASE_URL}${API_PREFIX}/schema/entity-types`, {
        data: deleteTestEntity
      });
      
      const response = await request.delete(`${BASE_URL}${API_PREFIX}/schema/entity-types/${deleteTestEntity.code}`);
      
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.deleted).toBe(true);
      
      // 验证已删除
      const getResponse = await request.get(`${BASE_URL}${API_PREFIX}/schema/entity-types/${deleteTestEntity.code}`);
      expect(getResponse.status()).toBe(404);
      
      console.log('✅ 删除实体类型成功');
    });

    test('API-09: 创建实体类型时缺少必填字段返回 400', async ({ request }) => {
      const invalidEntity = {
        code: 'InvalidEntity',
        // 缺少 label
        description: '没有标签的实体'
      };
      
      const response = await request.post(`${BASE_URL}${API_PREFIX}/schema/entity-types`, {
        data: invalidEntity
      });
      
      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('label');
      
      console.log('✅ 必填字段验证正确');
    });
  });

  test.describe('Relation Type API', () => {

    test('API-10: 获取所有关系类型列表', async ({ request }) => {
      const response = await request.get(`${BASE_URL}${API_PREFIX}/schema/relation-types`);
      
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.count).toBeGreaterThan(0);
      
      console.log(`✅ 获取到 ${body.count} 个关系类型`);
    });

    test('API-11: 获取单个关系类型详情', async ({ request }) => {
      // 先获取列表中的一个 code
      const listResponse = await request.get(`${BASE_URL}${API_PREFIX}/schema/relation-types`);
      const listBody = await listResponse.json();
      const firstCode = Object.keys(listBody.data)[0];
      
      const response = await request.get(`${BASE_URL}${API_PREFIX}/schema/relation-types/${firstCode}`);
      
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.label).toBeDefined();
      // 关系类型可能使用 from/to 或 sourceType/targetType
      expect(body.data.from || body.data.sourceType).toBeDefined();
      expect(body.data.to || body.data.targetType).toBeDefined();
      
      console.log('✅ 获取单个关系类型成功:', body.data.label);
    });

    test('API-12: 创建新关系类型', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${API_PREFIX}/schema/relation-types`, {
        data: testRelationType
      });
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(201);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.code).toBe(testRelationType.code);
      expect(body.data.sourceType).toBe(testRelationType.sourceType);
      expect(body.data.targetType).toBe(testRelationType.targetType);
      
      console.log('✅ 创建关系类型成功:', body.data.code);
    });

    test('API-13: 创建关系类型时 sourceType 不存在返回 400', async ({ request }) => {
      const invalidRelation = {
        ...testRelationType,
        code: `InvalidRelation_${Date.now()}`,
        sourceType: 'NonExistentType'
      };
      
      const response = await request.post(`${BASE_URL}${API_PREFIX}/schema/relation-types`, {
        data: invalidRelation
      });
      
      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('源实体类型不存在');
      
      console.log('✅ sourceType 验证正确');
    });

    test('API-14: 更新关系类型', async ({ request }) => {
      // 确保测试关系存在
      const updateTestRelation = {
        ...testRelationType,
        code: `UpdateTest_${Date.now()}`
      };
      
      await request.post(`${BASE_URL}${API_PREFIX}/schema/relation-types`, {
        data: updateTestRelation
      });
      
      const updateData = {
        label: '测试关系(已更新)',
        description: '更新后的关系描述'
      };
      
      const response = await request.put(`${BASE_URL}${API_PREFIX}/schema/relation-types/${updateTestRelation.code}`, {
        data: updateData
      });
      
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.label).toBe(updateData.label);
      expect(body.data.description).toBe(updateData.description);
      
      console.log('✅ 更新关系类型成功');
    });

    test('API-15: 删除关系类型', async ({ request }) => {
      // 创建一个专门用于删除测试的关系
      const deleteTestRelation = {
        ...testRelationType,
        code: `DeleteRelation_${Date.now()}`
      };
      
      await request.post(`${BASE_URL}${API_PREFIX}/schema/relation-types`, {
        data: deleteTestRelation
      });
      
      const response = await request.delete(`${BASE_URL}${API_PREFIX}/schema/relation-types/${deleteTestRelation.code}`);
      
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.deleted).toBe(true);
      
      console.log('✅ 删除关系类型成功');
    });

    test('API-16: 创建关系类型缺少必填字段返回 400', async ({ request }) => {
      const invalidRelation = {
        code: 'InvalidRelation',
        label: '无效关系'
        // 缺少 sourceType 和 targetType
      };
      
      const response = await request.post(`${BASE_URL}${API_PREFIX}/schema/relation-types`, {
        data: invalidRelation
      });
      
      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('sourceType');
      
      console.log('✅ 必填字段验证正确');
    });
  });

  test.describe('Data Consistency', () => {

    test('API-17: 创建实体后 Schema 数据一致性', async ({ request }) => {
      const newEntity = {
        ...testEntityType,
        code: `ConsistencyTest_${Date.now()}`
      };
      
      // 创建实体
      await request.post(`${BASE_URL}${API_PREFIX}/schema/entity-types`, {
        data: newEntity
      });
      
      // 获取 Schema 验证实体已添加
      const response = await request.get(`${BASE_URL}${API_PREFIX}/schema`);
      const body = await response.json();
      
      // 验证新实体存在于 Schema 中
      expect(body.data.entityTypes[newEntity.code]).toBeDefined();
      expect(body.data.entityTypes[newEntity.code].label).toBe(newEntity.label);
      
      // 验证实体类型列表包含新实体
      const listResponse = await request.get(`${BASE_URL}${API_PREFIX}/schema/entity-types`);
      const listBody = await listResponse.json();
      expect(listBody.data[newEntity.code]).toBeDefined();
      
      // 清理
      await request.delete(`${BASE_URL}${API_PREFIX}/schema/entity-types/${newEntity.code}`);
      
      console.log('✅ Schema 数据一致性正确');
    });

    test('API-18: 实体类型被关系引用时无法删除', async ({ request }) => {
      // 创建实体
      const refEntity = {
        ...testEntityType,
        code: `RefEntity_${Date.now()}`
      };
      await request.post(`${BASE_URL}${API_PREFIX}/schema/entity-types`, {
        data: refEntity
      });
      
      // 创建引用该实体的关系
      const refRelation = {
        ...testRelationType,
        code: `RefRelation_${Date.now()}`,
        sourceType: refEntity.code,
        targetType: 'Vehicle'
      };
      await request.post(`${BASE_URL}${API_PREFIX}/schema/relation-types`, {
        data: refRelation
      });
      
      // 尝试删除被引用的实体应该失败
      const response = await request.delete(`${BASE_URL}${API_PREFIX}/schema/entity-types/${refEntity.code}`);
      
      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('引用');
      
      // 清理
      await request.delete(`${BASE_URL}${API_PREFIX}/schema/relation-types/${refRelation.code}`);
      await request.delete(`${BASE_URL}${API_PREFIX}/schema/entity-types/${refEntity.code}`);
      
      console.log('✅ 引用检查正确');
    });
  });
});
