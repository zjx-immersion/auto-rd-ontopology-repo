"""
Prompt管理器 - 使用Markdown格式管理Prompt
"""
import os
from pathlib import Path
from typing import Dict, Any


class PromptManager:
    """Markdown Prompt 管理器"""
    
    def __init__(self, prompts_dir: str = None):
        if prompts_dir is None:
            prompts_dir = Path(__file__).parent / "markdown"
        self.prompts_dir = Path(prompts_dir)
        self._cache: Dict[str, str] = {}
    
    def load(self, name: str, **variables) -> str:
        """
        加载并渲染Prompt
        
        Args:
            name: Prompt文件名(不含扩展名)
            **variables: 模板变量
            
        Returns:
            渲染后的Prompt文本
        """
        if name not in self._cache:
            prompt_path = self.prompts_dir / f"{name}.md"
            if not prompt_path.exists():
                raise FileNotFoundError(f"Prompt not found: {prompt_path}")
            
            with open(prompt_path, 'r', encoding='utf-8') as f:
                self._cache[name] = f.read()
        
        template = self._cache[name]
        
        # 简单变量替换
        for key, value in variables.items():
            placeholder = f"{{{{{key}}}}}"
            template = template.replace(placeholder, str(value))
        
        return template
    
    def reload(self, name: str = None):
        """重新加载Prompt"""
        if name:
            self._cache.pop(name, None)
        else:
            self._cache.clear()


# 全局实例
prompt_manager = PromptManager()


# 便捷函数
def load_prompt(name: str, **variables) -> str:
    """加载Prompt"""
    return prompt_manager.load(name, **variables)
