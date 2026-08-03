#!/bin/bash
# ============================================================
# 慢帧时光 film — 视频批量转换脚本
# 用法：双击运行或在终端执行 bash tools/convert-videos.sh
#
# 把 videos/ 里的 .MOV 文件转成网页兼容的 .MP4
# 需要先安装 ffmpeg: brew install ffmpeg
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VIDEOS_DIR="$PROJECT_DIR/videos"

echo "🎬 慢帧时光 — 视频格式转换工具"
echo "================================"
echo ""

# 检查 ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ 未找到 ffmpeg"
    echo ""
    echo "请先安装 ffmpeg（macOS）："
    echo ""
    echo "  方法一（推荐，有 Homebrew）："
    echo "    brew install ffmpeg"
    echo ""
    echo "  方法二（无 Homebrew，先安装 Homebrew）："
    echo "    /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "    brew install ffmpeg"
    echo ""
    echo "安装完成后重新运行本脚本即可。"
    exit 1
fi

echo "✅ ffmpeg 已就绪"
echo ""

# 检查 videos 目录
if [ ! -d "$VIDEOS_DIR" ]; then
    echo "❌ 找不到 videos/ 目录"
    exit 1
fi

cd "$VIDEOS_DIR"

# 统计 MOV 文件
MOV_FILES=()
while IFS= read -r -d '' file; do
    MOV_FILES+=("$file")
done < <(find . -maxdepth 1 \( -iname "*.mov" \) -print0 | sort -z)

if [ ${#MOV_FILES[@]} -eq 0 ]; then
    echo "📭 videos/ 中没有 .MOV 文件，无需转换。"
    exit 0
fi

echo "📹 找到 ${#MOV_FILES[@]} 个 MOV 文件"
echo ""

CONVERTED=0
SKIPPED=0
FAILED=0

for mov in "${MOV_FILES[@]}"; do
    filename=$(basename "$mov")
    name_no_ext="${filename%.*}"
    mp4="${name_no_ext}.mp4"

    # 跳过已存在且更新的 MP4
    if [ -f "$mp4" ] && [ "$mp4" -nt "$mov" ]; then
        echo "⏭  跳过（MP4 已是最新）: $filename"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    echo "🎬 转换中: $filename → ${name_no_ext}.mp4"
    echo "   原始大小: $(du -h "$filename" | cut -f1)"

    # 获取视频高度
    height=$(ffprobe -v error -select_streams v:0 \
        -show_entries stream=height -of csv=p=0 "$filename" 2>/dev/null || echo "1080")

    # 超过 1080p 则限制
    if [ "$height" -gt 1080 ] 2>/dev/null; then
        SCALE_FILTER="-vf scale=-2:1080"
        echo "   分辨率: ${height}p → 限制到 1080p"
    else
        SCALE_FILTER=""
    fi

    # ffmpeg 转换
    # -c:v libx264     H.264 编码
    # -crf 23          质量（越小越好，18-28）
    # -preset fast     编码速度
    # -c:a aac         AAC 音频
    # -b:a 128k        音频码率
    # -movflags +faststart  边下边播
    if ffmpeg -i "$filename" \
        -c:v libx264 -crf 23 -preset fast \
        -c:a aac -b:a 128k \
        -movflags +faststart \
        $SCALE_FILTER \
        -y "$mp4" 2>&1 | tail -3; then
        echo "   ✅ 完成 → ${name_no_ext}.mp4 ($(du -h "$mp4" | cut -f1))"
        CONVERTED=$((CONVERTED + 1))
    else
        echo "   ❌ 失败"
        FAILED=$((FAILED + 1))
    fi
    echo ""
done

echo "================================"
echo "📊 转换完成！"
echo "   已转换: $CONVERTED 个"
echo "   已跳过: $SKIPPED 个"
if [ $FAILED -gt 0 ]; then
    echo "   失败:   $FAILED 个"
fi
echo ""
echo "💡 提示：记得修改 js/cameras.js 中的 video 字段指向新的 .mp4 文件"
