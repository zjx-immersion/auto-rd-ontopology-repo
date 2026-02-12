/**
 * 版本控制服务
 * 提供Schema和OAG的版本历史管理
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class VersionControlService {
  constructor() {
    this.versionsDir = path.join(__dirname, '../../data/versions');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.versionsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create versions directory:', error);
    }
  }

  /**
   * 创建版本快照
   * @param {string} resourceId - 资源ID (schemaId或oagId)
   * @param {string} resourceType - 资源类型 ('schema' | 'oag')
   * @param {Object} data - 数据内容
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 版本信息
   */
  async createSnapshot(resourceId, resourceType, data, options = {}) {
    const { comment = '', createdBy = 'system', parentVersionId = null } = options;
    
    const timestamp = new Date();
    const versionId = this.generateVersionId();
    const hash = this.calculateHash(data);
    
    const version = {
      id: versionId,
      resourceId,
      resourceType,
      version: await this.getNextVersionNumber(resourceId, resourceType),
      data,
      hash,
      comment,
      createdBy,
      createdAt: timestamp.toISOString(),
      parentVersionId
    };

    // 保存版本文件
    const versionPath = this.getVersionPath(resourceId, resourceType, versionId);
    await fs.mkdir(path.dirname(versionPath), { recursive: true });
    await fs.writeFile(versionPath, JSON.stringify(version, null, 2));

    // 更新版本索引
    await this.updateVersionIndex(resourceId, resourceType, version);

    return version;
  }

  /**
   * 获取版本历史
   * @param {string} resourceId - 资源ID
   * @param {string} resourceType - 资源类型
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 版本列表
   */
  async getVersionHistory(resourceId, resourceType, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    try {
      const indexPath = this.getIndexPath(resourceId, resourceType);
      const indexData = await fs.readFile(indexPath, 'utf8');
      const index = JSON.parse(indexData);
      
      const versions = index.versions || [];
      return versions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * 获取指定版本
   * @param {string} resourceId - 资源ID
   * @param {string} resourceType - 资源类型
   * @param {string} versionId - 版本ID
   * @returns {Promise<Object>} 版本信息
   */
  async getVersion(resourceId, resourceType, versionId) {
    const versionPath = this.getVersionPath(resourceId, resourceType, versionId);
    const data = await fs.readFile(versionPath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * 回滚到指定版本
   * @param {string} resourceId - 资源ID
   * @param {string} resourceType - 资源类型
   * @param {string} versionId - 版本ID
   * @param {Object} options - 回滚选项
   * @returns {Promise<Object>} 新版本信息
   */
  async rollback(resourceId, resourceType, versionId, options = {}) {
    const targetVersion = await this.getVersion(resourceId, resourceType, versionId);
    
    const rollbackOptions = {
      comment: `回滚到版本 ${targetVersion.version}${options.comment ? ': ' + options.comment : ''}`,
      createdBy: options.createdBy || 'system',
      parentVersionId: versionId
    };

    return this.createSnapshot(
      resourceId,
      resourceType,
      targetVersion.data,
      rollbackOptions
    );
  }

  /**
   * 对比两个版本
   * @param {string} resourceId - 资源ID
   * @param {string} resourceType - 资源类型
   * @param {string} versionId1 - 版本1 ID
   * @param {string} versionId2 - 版本2 ID
   * @returns {Promise<Object>} 对比结果
   */
  async diff(resourceId, resourceType, versionId1, versionId2) {
    const [v1, v2] = await Promise.all([
      this.getVersion(resourceId, resourceType, versionId1),
      this.getVersion(resourceId, resourceType, versionId2)
    ]);

    return this.calculateDiff(v1.data, v2.data);
  }

  /**
   * 获取版本分支
   * @param {string} resourceId - 资源ID
   * @param {string} resourceType - 资源类型
   * @returns {Promise<Array>} 分支列表
   */
  async getBranches(resourceId, resourceType) {
    const history = await this.getVersionHistory(resourceId, resourceType, { limit: 1000 });
    
    // 构建版本树
    const branches = [];
    const visited = new Set();
    
    for (const version of history) {
      if (!version.parentVersionId || !visited.has(version.parentVersionId)) {
        branches.push({
          name: `branch-${branches.length + 1}`,
          headVersionId: version.id,
          headVersion: version.version,
          createdAt: version.createdAt
        });
      }
      visited.add(version.id);
    }
    
    return branches;
  }

  /**
   * 删除版本
   * @param {string} resourceId - 资源ID
   * @param {string} resourceType - 资源类型
   * @param {string} versionId - 版本ID
   */
  async deleteVersion(resourceId, resourceType, versionId) {
    const versionPath = this.getVersionPath(resourceId, resourceType, versionId);
    await fs.unlink(versionPath);
    
    // 更新索引
    const indexPath = this.getIndexPath(resourceId, resourceType);
    try {
      const indexData = await fs.readFile(indexPath, 'utf8');
      const index = JSON.parse(indexData);
      index.versions = index.versions.filter(v => v.id !== versionId);
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      console.error('Failed to update version index:', error);
    }
  }

  // ============== 私有方法 ==============

  generateVersionId() {
    return `ver_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  calculateHash(data) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  async getNextVersionNumber(resourceId, resourceType) {
    try {
      const indexPath = this.getIndexPath(resourceId, resourceType);
      const indexData = await fs.readFile(indexPath, 'utf8');
      const index = JSON.parse(indexData);
      const versions = index.versions || [];
      
      if (versions.length === 0) return '1.0.0';
      
      const latest = versions[versions.length - 1];
      const parts = latest.version.split('.').map(Number);
      parts[2]++;
      
      if (parts[2] >= 100) {
        parts[2] = 0;
        parts[1]++;
      }
      if (parts[1] >= 100) {
        parts[1] = 0;
        parts[0]++;
      }
      
      return parts.join('.');
    } catch {
      return '1.0.0';
    }
  }

  getVersionPath(resourceId, resourceType, versionId) {
    return path.join(
      this.versionsDir,
      resourceType,
      resourceId,
      `${versionId}.json`
    );
  }

  getIndexPath(resourceId, resourceType) {
    return path.join(
      this.versionsDir,
      resourceType,
      resourceId,
      'index.json'
    );
  }

  async updateVersionIndex(resourceId, resourceType, version) {
    const indexPath = this.getIndexPath(resourceId, resourceType);
    let index = { versions: [] };
    
    try {
      const data = await fs.readFile(indexPath, 'utf8');
      index = JSON.parse(data);
    } catch {
      // 文件不存在，使用默认空索引
    }
    
    index.versions.push({
      id: version.id,
      version: version.version,
      comment: version.comment,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
      parentVersionId: version.parentVersionId,
      hash: version.hash
    });
    
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }

  calculateDiff(data1, data2) {
    const diff = {
      added: { entityTypes: [], relationTypes: [] },
      removed: { entityTypes: [], relationTypes: [] },
      modified: { entityTypes: [], relationTypes: [] }
    };

    const entityTypes1 = data1.entityTypes || {};
    const entityTypes2 = data2.entityTypes || {};
    const relationTypes1 = data1.relationTypes || {};
    const relationTypes2 = data2.relationTypes || {};

    // 检查实体类型变更
    const allEntityCodes = new Set([
      ...Object.keys(entityTypes1),
      ...Object.keys(entityTypes2)
    ]);

    for (const code of allEntityCodes) {
      const e1 = entityTypes1[code];
      const e2 = entityTypes2[code];

      if (!e1 && e2) {
        diff.added.entityTypes.push(e2);
      } else if (e1 && !e2) {
        diff.removed.entityTypes.push(e1);
      } else if (e1 && e2) {
        if (JSON.stringify(e1) !== JSON.stringify(e2)) {
          diff.modified.entityTypes.push({
            code,
            old: e1,
            new: e2
          });
        }
      }
    }

    // 检查关系类型变更
    const allRelationIds = new Set([
      ...Object.keys(relationTypes1),
      ...Object.keys(relationTypes2)
    ]);

    for (const id of allRelationIds) {
      const r1 = relationTypes1[id];
      const r2 = relationTypes2[id];

      if (!r1 && r2) {
        diff.added.relationTypes.push(r2);
      } else if (r1 && !r2) {
        diff.removed.relationTypes.push(r1);
      } else if (r1 && r2) {
        if (JSON.stringify(r1) !== JSON.stringify(r2)) {
          diff.modified.relationTypes.push({
            id,
            old: r1,
            new: r2
          });
        }
      }
    }

    return diff;
  }
}

module.exports = new VersionControlService();
