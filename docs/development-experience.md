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

**原因**：玻璃后方缺少可折射内容；自定义白色覆盖层过重；课程色只传入系统 tint 但对比不足；设备不支持 iOS 26 Glass API 时进入回退。把底栏背景和选中水珠放在同一个 `GlassContainer` 内也会让两层融合，看不出独立的液滴。

**实现原则**：

- 同时检查 `isLiquidGlassAvailable()` 和 `isGlassEffectAPIAvailable()`。
- iOS 26 使用原生 `GlassView`，Android/旧 iOS 使用 BlurView 与渐变。
- 不通过父级 `opacity: 0` 隐藏 GlassView；需要过渡时使用 `glassEffectStyle` 自带动画。
- 底栏背景使用独立 `GlassView`；只有移动的选中水珠和短暂尾迹放在同一个 `GlassContainer`，让两者在运动时融合。
- 导航和操作控件使用清透玻璃；课程块用适度的系统 tint + 半透明课程色覆盖和文字阴影，避免不透明颜色把折射全部盖住，并优先保证可读性。
- 不把所有内容卡片都玻璃化；保留“经典原生”一键回退。

**课表卡片出现横杠**：先检查卡片内部的人为高光层。本次是 `courseShine` 画在每张课程卡上方的 1 像素白线，并非系统玻璃折射；已删除。若仍看到线，再检查下方网格线是否穿透课程卡片。

**验证边界**：Web 预览只能检查布局、文字和回退材质，不能证明 iOS 原生折射。必须在 iOS 26 兼容设备的 Expo Go 或开发版上核对移动水珠、深浅色和“降低透明度”系统设置。Android 是模拟材质，不应称作 Apple 原生 Liquid Glass。

**iOS 27 Liquid Glass 滑杆**：`设置 > 外观 > Liquid Glass` 的透明度/着色滑杆是系统级外观偏好，目前没有公开 API 让第三方 App 读取百分比。不要伪造一个同步数值；在 iOS 26+ 使用原生 `GlassView`，并避免用固定不透明的自定义色层覆盖它，这样系统会自动对原生材质应用用户选择。`AccessibilityInfo` 只能读取公开的“降低透明度”开关，不能代表滑杆数值。

## 15. 自动记账的系统边界

**结论**：iOS 普通第三方 App 不能在后台读取微信、支付宝或银行卡 App 的交易记录，也没有通用的“消费完成立即回调”接口。Android 的通知监听可以在用户明确授权后识别支付通知，但需要原生模块、隐私说明、误识别处理和可关闭开关，不能把它伪装成银行接口。

**可落地路线**：

- iPhone：提供系统快捷指令“记一笔”入口；支持用户从微信/支付宝/银行导出的账单文件导入；AI 负责分类、去重和补全备注。
- Android：单独做可选的通知识别模块，只解析用户选择的支付通知，先显示待确认卡片，不直接静默入账。
- 所有平台：保留 AI 对话手动确认，保存来源、原始摘要和撤销入口；不保存支付账号、密码或完整账单原文。

## 16. 课表拖动编辑

**常见问题**：只在课程卡上加 `PanResponder` 不足以阻止外层 `ScrollView` 同时滚动，用户拖课时页面会跟着上下移动。

**处理**：拖动开始时临时把课表页面的 `ScrollView` 设为不可滚动；课程卡用捕获阶段接管手势，释放后再恢复滚动。落点根据列宽和节次高度吸附到网格，并绘制虚线轮廓提示目标位置。抬起动画只保留轻微 1% 缩放和回弹，避免夸张的“跳起”效果。

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

## 14. GitHub 首次推送工作流被拒绝 / Git HTTPS 超时

**现象**：`gh repo create --push` 已创建私有仓库，但因 `.github/workflows/ci.yml` 报 `workflow` scope 不足；补充授权后，`git push` 又连接 `github.com:443` 超时，而 `gh api` 可以访问。

**最快处理**：

1. 用 `gh auth refresh --hostname github.com --scopes workflow` 走官方设备授权；不要索要或记录用户密码、令牌。
2. 重试普通 `git push`，先排除临时网络波动。
3. 若仅 Git HTTPS 不通，可使用 GitHub 官方 Git Database API 上传已跟踪文件的 blob、完整 tree 和 commit。发布前比较远端 tree SHA 与本地 `git rev-parse HEAD^{tree}`，确保内容一致。
4. 空仓库的 Git Database API 会对 blob 返回 HTTP 409；先用 Contents API 创建临时 README 初始化，再在确认远端没有别人写入后替换为核对过的完整提交。
5. API 创建的提交可能与本地 Git 提交 SHA 不同（例如提交消息末尾换行）；需核对远端内容并将本地 `main` 对齐到远端 SHA，避免下次推送分叉。

本次处理后，[私有仓库](https://github.com/Start66613/campusflow) 与本地 `main` 的源码树一致，首次 CI 已通过。

## 17. 课表可读性与重复动画

**问题**：课表页把周次信息重复放在大卡片里，顶部的“一屏看全”只是占位文案；课程块高度和字号偏小，原生 Liquid Glass 过于透明时文字对比度不足；React Navigation 会复用已经挂载的 Tab 页面，单靠 `entering` 动画只能在首次挂载播放一次。

**处理**：

- 将学期和日期合并到紧凑标题，移除重复的周次 Hero，释放垂直空间；保留周一至周日七列，课程块改为更高的网格行和更大的文字/图标。
- 课程玻璃材质继续使用 iOS 原生 `GlassView`，但将课程色作为系统 tint，并叠加低透明度的同色底层。这样有明显的颜色和可读性，又不使用不透明面板去“假装”液态玻璃，系统透明度/材质设置仍可自然生效；开启“降低透明度”时回退为清晰底色。
- `Screen` 监听 `useIsFocused()`，每次 Tab 重新获得焦点都把 Reanimated 进度归零再平滑过渡，因此返回页面时动画会再次播放；同时遵守系统“减少动态效果”设置。

以后调整课表密度时，优先改 `rowHeight`、课程字号和标题占用空间，不要通过横向滚动隐藏星期列；调整玻璃颜色时保持 tint + 低透明度底层的分层结构。

## 18. Expo Go 显示 HTTP 500 或提示 CLI 未登录

**现象**：手机 Expo Go 已登录，但扫描局域网二维码后出现 `UnexpectedServerError`、HTTP 500，或提示“Expo Go 已登录，但 Expo CLI 未登录”。

**根因**：Expo Go 的账号会话和电脑 Expo CLI 的账号会话彼此独立。生成项目清单时，CLI 会向 Expo 服务查询当前账号；网络受限或电脑没有完成网页登录时，清单请求会返回 500。手机热点场景还可能让手机无法稳定访问作为热点客户端的电脑局域网地址。

**处理顺序**：

1. 用 `npx expo login --browser` 完成电脑端网页登录，并用 `npx expo whoami` 确认用户名。
2. 用 `npx expo start --go --lan --clear` 重启 Metro，扫描新二维码。
3. 在电脑端带 `Accept: application/expo+json` 和 `Expo-Platform: ios` 请求 Metro 地址；应返回 `200 application/expo+json`。再确认 iOS bundle 地址返回 200，才让手机重试。
4. 若手机作为热点提供方，改用同一普通 Wi-Fi、另一台设备热点，或可用的 Tunnel。不要把 Expo Go 的手机登录误当成电脑 CLI 已登录。

## 19. 液态玻璃和全局动效统一

**设计判断**：Liquid Glass 的重点是触摸反馈、层级和可读性，不是把所有内容变得透明。Apple 建议在导航和控制层谨慎使用玻璃，让正文保持清晰；频繁交互的动画应短、准确，并遵守“减少动态效果”。参考 [Apple Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)、[Apple Motion](https://developer.apple.com/design/human-interface-guidelines/motion) 和 [Apple Layout](https://developer.apple.com/design/human-interface-guidelines/layout)。

**Expo 限制**：[SDK 57 GlassEffect 文档](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/)明确提示，`GlassView` 或其父层的 opacity 变为 0 可能导致原生玻璃不显示。以后给含玻璃的页面、课程块、快捷卡片做进入动画，优先使用小幅 transform，不在父层做 FadeIn/FadeOut；原生玻璃材质切换用组件提供的动画配置。`isLiquidGlassAvailable()` 和 `isGlassEffectAPIAvailable()` 仍需同时检查。

**开源参考**：[expo-glass-tabs](https://github.com/davidmokos/expo-glass-tabs) 用 UI 线程的 transform 驱动选中胶囊，强调小幅页面过渡；[RN-Liquid-Glass-Tabs](https://github.com/3advance/RN-Liquid-Glass-Tabs) 展示了 React Native 原生标签栏的玻璃层处理。本项目借鉴“单一胶囊移动、触感反馈、平台回退”的思路，不直接复制其代码或新增依赖。

**本项目约定**：

- 动画参数集中放在 `components/motion.tsx`；高频点击只轻微缩小，Tab 和分段选择共享同类阻尼弹簧。
- `Screen` 每次重新获得焦点时做 6 像素轻位移，不再与 Tab 默认淡入叠加；课程拖动视图已占用 transform，不叠加进入位移动画。
- 课程卡玻璃要有课程色，但文字必须独立保证对比度；内容卡片比浮动控制层更不透明。已有实色主题 Hero 不要再盖玻璃层。
- 先跑 `npm run typecheck` 和 `expo export --platform all`；随后在 iPhone/Android 真机检查底栏、AI 输入框、课程名称、深色模式、减少动态效果和拖动手感。导出成功只能证明可打包，不能证明视觉效果合格。

## 20. 真机布局小问题：节次、开关与拖动收尾

**课表节次重叠**：时间和编号分别采用普通流布局与绝对定位，原来 24 pt 的窄栏放不下三行，因此编号压在时间上。时间轴须有自己的固定宽度容器，并以 `justifyContent: 'space-between'` 排列开始时间、节次号、结束时间；密集时间文本使用等宽数字并限制最大字体倍率。检查 320–430 pt 宽度，不能只看模拟器默认尺寸。

**开关错位**：原生 `Switch` 直接作为动画 `Pressable` 的子节点，在 iPhone 截图中视觉位置与行中心不一致。给尾部控件固定尺寸的居中槽位；开关由明确的 52×32 pt 轨道与 28 pt 滑块构成，外侧保持 48 pt 触摸高度，提供 `accessibilityRole="switch"` 和 checked 状态。带开关的设置行不要再套可点击的整行父控件，避免嵌套触摸区。

**拖动弹飞**：拖动位移 `dragX/Y`、课程卡 `left/top` 的数据更新以及布局动画同时发生，相当于在落点叠加了两次移动。松手时先算出被网格边界限制的目标格，只做一次位置提交并清零拖动位移；课程卡不用额外布局弹簧。取消拖动才使用短时无过冲归位。

**以后提交前的截图检查**：逐屏检查小字号文字是否重叠、开关与行中心是否对齐、滚动和拖动手势是否冲突、松手是否跳位或过冲，并在 iPhone 真机上验证。类型检查和 Metro 200 不等于布局正确。

## 21. AI 输入框反复被底栏遮挡

**根因**：`KeyboardAvoidingView` 的 iOS `behavior="padding"` 会在内部覆盖自身的 `paddingBottom`。把浮动 Tab 底栏的让位空间直接写在这个组件上，屏幕静止时也可能被改写为 0，导致输入框沉入底栏。

**修复**：`KeyboardAvoidingView` 只负责键盘；其内层的 `flex: 1` 容器独立设置底栏高度、Safe Area 与内容间隙之和。键盘出现时底栏隐藏，内层只留 8 pt。后续不要通过增加同一个 `paddingBottom` 数值来碰运气；真机要分别检查未弹键盘、弹键盘、收键盘三个状态，以及 320–430 pt 屏宽。

## 22. 成绩口径与课程性质

湘潭大学本科生学籍管理规定中的学期平均绩点使用「所修课程」学分加权；但学院评奖/推免等又存在「必修课平均学分绩点」等特定口径。不能把用户需要的必修课口径泛称学校唯一官方 GPA。此 App 主卡明确标为「必修课 GPA」，选修课只统计已获学分，课程性质不明的先排除并提示人工确认。导入时保留课程性质字段；用户手动更正后，重新导入同学期同课程须保留更正。正方 `xfjd` 是学分绩点（质量点），若 `jd` 缺失，计算单课绩点要先除以课程学分，不能再乘一次。

参考：[湘潭大学本科生学籍管理规定](https://jwc.xtu.edu.cn/info/1016/1110.htm)、[计算机学院 2026 年推免细则](https://jwxy.xtu.edu.cn/info/1018/5019.htm)。其他用途请始终以教务系统实际显示口径为准。
