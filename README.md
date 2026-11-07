# 帧刻 Framecut

浏览器本地视频转动图工作台，支持 GIF、动态 WebP、APNG。使用 React、Vinext 与 FFmpeg.wasm，视频不上传服务器。

## 启动

```sh
npm ci
node scripts/prepare-media.mjs
npm run dev
```

预览地址为 http://127.0.0.1:5173/ 。生产构建：`npm run build`。

## 功能

- 文件选择、拖放导入，内置原创 6 秒帆船示例。
- 读取实际帧时间戳，支持逐帧前后移动、起止帧缩略图、悬停预览、秒数输入和区间播放。
- 结束帧包含在导出中；I/O 设置边界，左右键逐帧，空格播放。
- 多种预设宽度、自定义宽度、保持比例、5–30 FPS、画质选择、播放速度和循环选项。
- 实际编码进度、取消、结果预览和下载。
- 300 MB、10 分钟输入上限；移动端自适应。

## 精度说明

帧索引来自 ffprobe 的真实帧时间戳；导出通过 trim 的 start_frame/end_frame 截取帧。预览通过浏览器解码器定位到目标帧内部时间。浏览器不支持的编码会生成本地 MP4 预览。GIF 时间间隔只能以 10 ms 表示，输出 FPS 不同于原片会重采样；不承诺所有原始帧都在较低帧率的输出中保留。

## 验证

- TypeScript 检查及生产构建通过。
- 960×540、24 FPS、6 秒样例建立 144 个实际帧时间戳。
- 同一 WASM 引擎验证 GIF、WebP、APNG 的 320×180、24 帧导出；GIF/APNG 时长 1 秒；单帧 GIF 导出通过。
- 浏览器验证：视频导入、起点逐帧移动、秒数输入、三种格式生成和下载链接、真实进度、桌面/手机布局。

## 本次遇到的问题及处理

1. npm 在受限网络无法解析域名：通过获准的联网执行安装。
2. 增加依赖后锁文件不匹配：先更新锁文件，再使用统一安装脚本。
3. Vite 不允许从源码动态导入 public 下的模块：改为独立 module 引导脚本加载。
4. FFmpeg.wasm 0.12.10 的 ffprobe 成功时可能返回 -1：拒绝正数错误码，同时校验实际输出 JSON 和帧数据。
5. 浏览器自动化插件连接超时：使用应用内浏览器完成交互验证。
6. WASM 内核约 32 MB：按 8 MB 分片部署，浏览器本地合并，避免单个静态资源的大小限制。

## 开源组件

- FFmpeg.wasm: https://github.com/ffmpegwasm/ffmpeg.wasm （包装器 MIT）
- @ffmpeg/core 0.12.10: https://github.com/ffmpegwasm/ffmpeg.wasm/tree/main/packages/core （内核遵循对应 FFmpeg 构建的 GPL 条款）
- FFmpeg: https://ffmpeg.org/ ，源码与构建脚本：https://github.com/ffmpegwasm/ffmpeg.wasm
- 设计与代码为此项目创建；示例帆船动画为程序生成的原创素材。
