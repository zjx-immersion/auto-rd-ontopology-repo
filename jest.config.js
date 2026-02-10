// Jest配置文件
module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/frontend/src/**/*.test.js',
    '**/backend/src/**/*.test.js'
  ],
  
  // 模块路径别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '^@backend/(.*)$': '<rootDir>/backend/src/$1'
  },
  
  // 转换器
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // 忽略转换的模块
  transformIgnorePatterns: [
    '/node_modules/(?!antd|@ant-design|rc-).+\\.js$'
  ],
  
  // 覆盖率配置
  collectCoverageFrom: [
    'frontend/src/**/*.js',
    'backend/src/**/*.js',
    '!frontend/src/index.js',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/tests/**'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  
  // 覆盖率报告目录
  coverageDirectory: 'coverage',
  
  // 测试前设置文件
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // 模块文件扩展名
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // 测试超时
  testTimeout: 10000,
  
  // 详细输出
  verbose: true
};
