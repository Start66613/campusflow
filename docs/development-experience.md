# CampusFlow 开发经验与快速排障

目的：把已经踩过的坑变成可重复执行的检查表。遇到相似问题时先按“最快处理”执行，再深入排查。

## 1. Expo Go 提示 SDK 不兼容

**现象**：手机提示“Expo Go 是 SDK 57，项目使用 SDK 54”。

**原因**：iOS 只能安装 App Store 的最新版 Expo Go，项目 SDK 必须与它兼容。通用网页说明可能滞后，真机报错和版本化文档更可靠。

**最快处理**：

1. 以手机错误页显示的 SDK 为准。
2. 阅读项目 `AGENTS.md` 指定的版本文档，本项目固定使用 Expo SDK 57。
3. 运行 `npx.cmd expo install --fix`、`npx.cmd expo install --check`。
4. 运行 `npx.cmd expo-doctor@latest`、`npm.cmd run typecheck`。
5. 清缓存重启：`npx.cmd expo start --go --lan --clear`。

## 2. PowerShell 无法执行 npx/eas 脚本

**现象**：出现 `PSSecurityException` 或“禁止运行脚本”。

**原因**：PowerShell 执行策略拦截 `npx.ps1`，不是 Node 或 Expo 安装失败。

**最快处理**：在 Windows 上调用 `npx.cmd`、`npm.cmd`，不要输入错误提示里的单个 `Y` 当命令，也不需要永久放宽系统执行策略。

## 3. Expo Router 57 禁止直接导入 React Navigation

**现象**：iOS 导出提示 Expo Router 不再兼容 `@react-navigation/native`。

**原因**：SDK 56 起 Router 内置导航实现，主题对象也从 `expo-router` 导出。

**最快处理**：

```ts
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
```

改完后必须跑一次真实 `expo export --platform ios`，只跑 TypeScript 不足以发现 Metro 的导入限制。

## 4. iPhone 热点下 Expo Go 一直 Opening project

**原因候选**：手机与电脑不在同一网络、Metro 只监听 localhost、端口被占用、防火墙或缓存异常。

**最快处理**：

1. 电脑连接该 iPhone 的个人热点。
2. 查询电脑 WLAN 地址，本次测试使用过 `172.20.10.x` 网段。
3. 使用 `--lan` 启动，不使用 localhost 地址扫码。
4. 检查端口确实由 Node/Metro 监听，再让手机重新扫码。
5. 不要结束显示二维码的命令窗口。

## 5. iOS Liquid Glass 看起来只是白色透明板

**原因**：玻璃后方缺少可折射内容；自定义白色覆盖层过重；课程色只传入系统 tint 但对比不足；设备不支持 iOS 26 Glass API 时进入回退。

**实现原则**：

- 同时检查 `isLiquidGlassAvailable()` 和 `isGlassEffectAPIAvailable()`。
- iOS 26 使用原生 `GlassView`，Android/旧 iOS 使用 BlurView 与渐变。
- 不通过父级 `opacity: 0` 隐藏 GlassView；需要过渡时使用 `glassEffectStyle` 自带动画。
- 导航和操作控件使用清透玻璃；课程块增加 45% 左右的课程色覆盖和文字阴影，优先保证可读性。
- 不把所有内容卡片都玻璃化；保留“经典原生”一键回退。

## 6. 浮动底栏遮挡 AI 输入框

**根因**：绝对定位的底栏不参与页面正常布局，仅给页面写一个经验 padding 很容易在不同安全区、字体缩放和 Android 设备上失效。

**当前方案**：

- 底栏高度、内容间距放在 `src/layout.ts` 统一管理。
- AI 输入区域留在正常布局，消息列表使用 `flex: 1` 自动收缩。
- `KeyboardAvoidingView` 的底部留白 = 安全区 + 底栏高度 + 固定可视间距；键盘出现时留白缩至 8 像素。
- 键盘出现时底栏隐藏；iOS 用 `keyboardWillShow` 尽早响应，Android 用 `keyboardDidShow`。

以后如果再次遮挡，先核对 `src/layout.ts` 的底栏常量、底栏实际高度、键盘事件和安全区，不要继续叠加零散 magic number。

## 7. 底栏选中项出现方形轮廓

**原因**：导航库的 `tabBarActiveBackgroundColor` 背景层没有继承预期的圆角。

**处理**：取消默认选中背景，用一个共享的绝对定位玻璃胶囊跨标签平移、先横向拉伸再弹回。保持 SF Symbols/Material Symbols 和文字在胶囊上层，避免位图导航图标模糊。参考 9 月 21 日用户视频中的“液体选中块”运动，而不是给每个图标单独加静态方块。

## 8. AsyncStorage 新设置升级后是 undefined

**原因**：只在顶层合并保存数据会让旧版完整 `settings` 覆盖新版默认设置。

**处理**：水合时同时深合并设置：

```ts
settings: { ...initialData.settings, ...parsed.settings }
```

新增设置字段时必须验证旧安装升级，不只验证全新安装。

## 9. DeepSeek 模型名称和能力发生变化

**经验**：不要把历史模型名写死后长期不核对。当前正式名称是 `deepseek-flash`，支持图片和思考模式；以官方 `/models` 和版本文档为准。

**安全原则**：

- API Key 只进 SecureStore，不进 Git、AsyncStorage 或日志。
- UI 展示可核对的处理摘要，不直接展示内部逐字推理。
- 发布给他人前改成带鉴权、限流、额度和审计脱敏的服务端代理。

## 10. 湘潭大学教务自动导入

**经验**：网页登录后的 Cookie 属于 WebView 会话，原生 `fetch` 不一定共享。应在已登录的同源页面内注入脚本，请求正方接口，再通过 WebView bridge 传回结构化数据。

**快速排查顺序**：登录状态 → 接口 HTTP 状态 → JSON 字段 → 学年学期参数 → 解析器兼容字段。禁止绕过验证码、CAS 或保存用户密码。

## 11. iOS 安装与签名

- Windows 上最省时间的界面验证路径是 Expo Go。
- 普通 Apple ID 的官方七日签名需要 Mac + Xcode Personal Team；EAS 云端官方签名需要 Apple Developer Program。
- 来历不明的证书或第三方签名可能被吊销，也有账号和隐私风险，不作为正式流程。
- AltServer 出现证书吊销检查和 WinHTTP 超时时，优先恢复网络/系统证书链；若只是开发验证，直接使用 Expo Go。

## 12. 每次改动后的最小验证矩阵

```powershell
npm.cmd run typecheck
npx.cmd expo install --check
npx.cmd expo-doctor@latest
npx.cmd expo export --platform ios --output-dir dist-ios-check
npx.cmd expo export --platform android --output-dir dist-android-check
```

涉及布局时还必须在至少一台刘海/灵动岛 iPhone 和一台 Android 真机验证：底部安全区、键盘、字体缩放、深色模式和减少动态效果。

## 13. GitHub 与密钥卫生

- 仓库默认使用 private。
- `.env`、Apple 证书、Android keystore、provisioning profile、EAS 本地凭据和教务账号不提交。
- 每个阶段更新 `CHANGELOG.md`；出现可复用故障时同步更新本文。
- 推送前运行 `git status` 和敏感文件检查，构建目录保持在 `.gitignore` 中。
