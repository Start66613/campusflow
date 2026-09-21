# CampusFlow

CampusFlow 是一个面向 iPhone 和 Android 的个人校园助手。它把课表、自然语言日程、作业待办、消费记录、番茄钟、成绩与周报放在同一个离线优先的 App 里。

当前工程基于 Expo SDK 57、React Native 0.86 和 TypeScript，可在 Windows 上开发，通过 Expo Go 预览通用界面，并使用 EAS 构建带系统日历和 iOS 小组件的开发版/TestFlight 包。

开发进展见 [CHANGELOG.md](CHANGELOG.md)，已解决问题与快速排障见 [docs/development-experience.md](docs/development-experience.md)。

## Android 测试包

生成可直接安装到实体 Android 手机的 APK：

```bash
npx eas-cli build --platform android --profile android-apk
```

构建配置会复用 EAS 托管的 Android 签名密钥，并自动递增版本号。当前 Android 版包含通用核心功能、日历和通知；“下一节课”桌面小组件目前仅在 iOS 版提供。

## 已完成

- 周一到周日固定一屏显示的周课表、单双周数据结构、课程类型与颜色。
- CSV 导入，以及由 DeepSeek Flash 多模态模型驱动的课表截图识别入口。
- 聊天式 AI 快记：日程、待办、作业和消费；未配置 AI 时有中文离线规则兜底。
- 课程批量写入 iPhone 日历，默认课前 15 分钟提醒。
- 本地通知式早八提醒和基于次日课表的空闲学习提醒。
- 番茄钟、本周专注时长、任务完成率和消费分类。
- 成绩列表、学分加权 GPA 与每周学习/消费/出勤摘要。
- 浅色、深色、护眼与跟随系统模式。
- iOS “下一节课”小组件已完成原型，当前暂停打包接入，优先保证通用核心功能。
- 湘潭大学正方 V9 内置网页登录导入，可读取当前课表与成绩页面且不保存密码。
- iOS 26 原生 Liquid Glass，旧 iOS 与 Android 使用模糊材质回退。
- GitHub Actions 类型检查和 Web 导出验证。

## 本地运行

```bash
npm install
npm run start
```

Expo Go 可以预览主要页面、离线快记、消费、任务和番茄钟。`expo-calendar` 与 `expo-widgets` 不在 Expo Go 中提供，需要开发版：

```bash
npx eas-cli login
npx eas-cli build --profile development --platform ios
```

安装生成的 iOS 开发版后再运行 `npm run start`，即可调试系统日历、通知和小组件。iOS 构建需要 Apple Developer 账号；云端 EAS Build 不要求本机是 Mac。

## 个人 AI

在 App 的“我的 → 个人 AI 密钥”中粘贴 DeepSeek API Key。真机使用 SecureStore 保存：Android 由 Keystore 保护，iOS 使用 Keychain；密钥不会进入源码、Git、普通 AsyncStorage 或日志。当前默认模型是 `deepseek-flash`，同时处理文字和图片。

个人直连适合自用。若以后公开分发，应该改成带鉴权、限流和配额的后端代理。

## 可选后端 AI 服务

复制环境变量示例并填入服务端密钥：

```bash
copy .env.example .env
npm run server
```

手机不能访问电脑上的 `localhost`，真机测试时将 `EXPO_PUBLIC_API_URL` 改成同一局域网可访问的地址或已部署的 HTTPS 域名，再重新启动 Metro。

后端使用 OpenAI Responses API 的 Structured Outputs，把模型结果约束为日程、待办、消费或课程 JSON。`OPENAI_API_KEY` 没有 `EXPO_PUBLIC_` 前缀，因此不会进入 App 包。生产环境建议把 `ALLOWED_ORIGIN` 设为实际来源，并增加鉴权、限流和审计脱敏。

## CSV 格式

```csv
课程,老师,教室,星期,开始节次,结束节次,开始时间,结束时间,周次,类型
高等数学,周老师,博学楼A302,周一,1,2,08:00,09:40,1-18,专业课
```

星期支持“周一”或 1-7；周次支持 `1-18` 或用空格、分号分隔；类型支持专业课、公共课、实验、选修课。

## 教务系统接入

App 内的“湘潭大学教务”入口使用内置网页登录，登录成功后在同源 WebView 会话中读取课表与成绩，不保存教务密码。另一种可选的服务端部署方案是设置 `SCHOOL_ADAPTER_URL`，由 `POST /api/school/sync` 转发给固定的学校适配器；接口契约和安全要求见 [docs/school-adapter.md](docs/school-adapter.md)。两种方案都不绕过学校认证。

## 验证命令

```bash
npm run typecheck
npx expo config --type public
npx expo export --platform web
```

## 发布到 GitHub

```bash
git init
git add .
git commit -m "feat: bootstrap CampusFlow iPhone app"
gh repo create campusflow --private --source=. --remote=origin --push
```

仓库默认忽略 `.env`、构建产物、原生生成目录和签名文件。不要提交 Apple 证书、教务密码或 OpenAI API 密钥。
