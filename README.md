# Kindle Clippings

公开 Beta 版的 Kindle 划线排版工具。它可以在浏览器里导入 Kindle `My Clippings.txt`，整理划线内容，并导出 PNG、文字 PDF、高清 PDF、Word 和 Markdown。

## 当前状态

- 版本阶段：公开 Beta
- 应用形态：纯前端静态网页
- 数据处理：用户文件只在本地浏览器读取，不上传服务器
- 本地存储：排版设置和导入内容会保存在当前浏览器的 `localStorage`
- 主要限制：导出功能依赖浏览器能力、中文字体文件和 CDN 加载状态
- 文字 PDF：会嵌入当前选择的正文字体，尽量保持和预览一致，并保留文字可选中/可复制

## 上线文件

公开部署时只需要发布这些内容：

```text
index.html
styles.css
app.js
assets/fonts/
README.md
```

不要发布 `output/`，其中只是本地导出和渲染检查产物。

## 推荐部署方式

### Netlify

1. 将当前目录作为静态站点上传或连接到仓库。
2. 使用仓库根目录作为发布目录。
3. 保留 `netlify.toml`，它会给字体和静态资源设置缓存，并阻止公开访问 `output/`。

### Vercel

1. 将当前目录作为静态项目导入。
2. 不需要构建命令。
3. 保留 `vercel.json` 和 `.vercelignore`，避免 `output/` 被部署。

### GitHub Pages

1. 只提交上线文件，不提交 `output/`。
2. 从仓库根目录启用 Pages。

## 上线前验收

- 打开部署网址，确认页面样式、图标和中文字体正常。
- 导入一份 Kindle `My Clippings.txt`，确认能识别书名、作者、划线数量和分页。
- 测试导出 Markdown、Word、PNG、文字 PDF、高清 PDF。
- 至少在 Chrome 和 Safari 各测一次。
- 不导入内容时点击各导出按钮，应显示“没有可导出内容”一类提示。
- 导入多本书的 clippings 文件，确认列表分组和预览分页正常。

## 第三方依赖

页面通过 CDN 加载以下库：

- `html2canvas`
- `jsPDF`
- `pdf-lib`
- `@pdf-lib/fontkit`
- `lucide`

如果用户所在网络无法访问 CDN，导出图片、PDF 或图标可能不可用。公开 Beta 阶段先保留 CDN 方案；正式版建议将这些依赖本地化。

## 字体说明

文字 PDF 使用 `assets/fonts/` 中的本地字体文件。圆体使用 Resource Han Rounded CN Regular，来源于 Resource Han Rounded 项目；该项目说明字体部分采用 SIL Open Font License。

- 项目说明：https://github.com/CyanoHao/Resource-Han-Rounded
- 字体信息：https://fontmeme.com/fonts/resource-han-rounded-cn-font/
