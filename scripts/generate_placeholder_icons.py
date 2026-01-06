#!/usr/bin/env python3
"""
生成PWA占位符图标
用于开发和测试阶段，正式上线前需要替换为设计师提供的图标
"""

from PIL import Image, ImageDraw, ImageFont
import os

# 图标尺寸
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
SHORTCUT_SIZE = 96

# 颜色配置
BACKGROUND_COLOR = (14, 165, 233)  # #0ea5e9 天蓝色
TEXT_COLOR = (255, 255, 255)  # 白色

# 输出目录
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')

def create_icon(size, text, filename):
    """创建单个图标"""
    # 创建图像
    img = Image.new('RGB', (size, size), BACKGROUND_COLOR)
    draw = ImageDraw.Draw(img)
    
    # 尝试使用系统字体
    try:
        # Windows
        font_size = int(size * 0.4)
        font = ImageFont.truetype("msyh.ttc", font_size)  # 微软雅黑
    except:
        try:
            # macOS/Linux
            font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", font_size)
        except:
            # 使用默认字体
            font = ImageFont.load_default()
    
    # 计算文本位置（居中）
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) / 2
    y = (size - text_height) / 2
    
    # 绘制文本
    draw.text((x, y), text, fill=TEXT_COLOR, font=font)
    
    # 保存图标
    filepath = os.path.join(OUTPUT_DIR, filename)
    img.save(filepath, 'PNG')
    print(f'✓ 生成图标: {filename} ({size}x{size})')

def main():
    """主函数"""
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print('开始生成PWA占位符图标...\n')
    
    # 生成应用图标
    print('生成应用图标:')
    for size in ICON_SIZES:
        create_icon(size, '玉珍', f'icon-{size}x{size}.png')
    
    print('\n生成快捷方式图标:')
    # 生成快捷方式图标
    shortcuts = [
        ('AI', 'shortcut-chat.png'),
        ('训练', 'shortcut-training.png'),
        ('动作', 'shortcut-exercise.png'),
        ('进度', 'shortcut-progress.png'),
    ]
    
    for text, filename in shortcuts:
        create_icon(SHORTCUT_SIZE, text, filename)
    
    print('\n✅ 所有图标生成完成！')
    print(f'📁 输出目录: {OUTPUT_DIR}')
    print('\n⚠️  注意: 这些是占位符图标，正式上线前请替换为设计师提供的图标')

if __name__ == '__main__':
    main()
