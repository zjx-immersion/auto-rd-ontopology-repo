// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Mock matchMedia - 必须返回完整的MediaQueryList对象
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock getComputedStyle
window.getComputedStyle = jest.fn().mockImplementation(() => ({
  getPropertyValue: jest.fn(),
}));

// Mock react-flow - 使用更完整的mock
jest.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }) => <div data-testid="react-flow">{children}</div>,
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Panel: ({ children }) => <div data-testid="panel">{children}</div>,
  useNodesState: (initial) => [initial || [], jest.fn(), jest.fn()],
  useEdgesState: (initial) => [initial || [], jest.fn(), jest.fn()],
  useReactFlow: () => ({
    screenToFlowPosition: jest.fn((pos) => pos),
    fitView: jest.fn(),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    project: jest.fn((pos) => pos),
    getNodes: jest.fn(() => []),
    getEdges: jest.fn(() => []),
  }),
  addEdge: jest.fn((params, edges) => [...(edges || []), params]),
  Handle: ({ children }) => <div>{children}</div>,
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
  MarkerType: {
    Arrow: 'arrow',
    ArrowClosed: 'arrowclosed',
  },
  ConnectionMode: {
    Strict: 'strict',
    Loose: 'loose',
  },
  applyNodeChanges: jest.fn((changes, nodes) => nodes || []),
  applyEdgeChanges: jest.fn((changes, edges) => edges || []),
}));

// Mock antd的ColorPicker
jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  return {
    ...actual,
    ColorPicker: ({ value, onChange, ...props }) => (
      <input 
        type="color" 
        value={value || '#1890ff'} 
        onChange={(e) => onChange?.(e.target.value)}
        data-testid="color-picker"
        {...props}
      />
    ),
  };
});

// 清理所有mock
afterEach(() => {
  jest.clearAllMocks();
});
