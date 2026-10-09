# 面试手册

七科常见高频面试问题，共 140 题：C++、数据结构、操作系统、计算机网络、计算机组成原理、MySQL、Redis。每题包含核心回答、回答要点、带答案的追问、易错点和原始参考资料。

## 本地阅读

在此目录运行 `npm start`，访问 http://127.0.0.1:4173 。只需要 Node.js，无需安装依赖。不要直接双击 HTML，浏览器可能阻止本地 JSON 的读取。

网页支持全文搜索（多个关键词以空格分隔）、科目及难度筛选、收藏、已学会标记、继续阅读。记录保存在当前浏览器的本地存储中。

右上角“颜色模式”可选择深色、浅色或跟随系统。默认跟随系统，手动选择保存在当前浏览器中；打印和 PDF 使用浅色排版。

网页使用随站点提供的 Noto Sans SC 中文黑体子集，正文桌面 17px、手机 16px，行高 1.95。字体依据 SIL Open Font License 1.1 分发，许可保存在 `dist/fonts/OFL.txt`。字体原始资料：[Google Fonts / Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc)。新增文章后可用 Python fonttools 运行 `build_fonts.py --source <NotoSansSC-variable-font-path>` 更新字体子集。

## PDF

`dist/pdf/all.pdf` 是整本手册；同目录的七份分科 PDF 与网页使用相同内容。网站右上角可直接下载，也可将当前单题、收藏、搜索结果或科目通过浏览器打印另存为 PDF。

生成 PDF：安装 Python 的 reportlab 与 pypdf 后运行 `python build_pdf.py`。脚本当前使用 Windows 自带的宋体（`C:/Windows/Fonts/simsun.ttc`）；其他系统需将字体路径改为本机可用的中文 TrueType 字体。生成后的 PDF 已嵌入字体，可跨设备阅读。

## 修改内容和验证

编辑 `dist/content-*.json`，保持每题 id 不变以保留阅读记录；重新生成 PDF 后运行 `npm run check`。全部文章为中文原创总结，来源链接附在每题内。

内容是经典面试知识点汇总，未声称穷举全网面经，也未以招聘频次统计定义高频。C++ 主要按 C++17/20，MySQL 按 8.4 LTS InnoDB，Redis 按开源版常用特性；协议、硬件、数据库配置及实现细节请结合对应参考文档。

整理日期：2026-10-09。
