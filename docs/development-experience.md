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

## 23. 图片自定义、课程同步与 AI 写入的安全边界

**相册图片**：`expo-image-picker` 返回的原生 URI 可能属于临时缓存。头像、全局背景和课程背景选中后，应复制到 `expo-file-system` 的应用文档目录，再把新 URI 写入本地设置；不要把图片 Base64 塞进 AsyncStorage。网页预览的临时 URI 不保证刷新后仍有效，因此以 iPhone/Android 真机为准。图片权限文案要覆盖所有用途。新应用图标是原生包资源，Expo Go 不会把自己的桌面图标换成项目图标。

**数据合并**：教务自动同步与用户明确选择的“整表替换”是两种不同操作。自动同步保留 `customized` 课程（包括手动修改、手动新增和 AI 新增）；整表替换前明确提示覆盖。AI 识别课程只追加，先校验星期、节次、周次，再按课程名＋时间＋周次去重。缺字段不让模型猜，且空命令不能显示“写入成功”。后续若要让用户删除的教务课程在再同步后仍保持删除，需要引入同步墓碑记录。

**AI 与联网**：成绩分析只能在用户主动触发时发送成绩、专业和目标。联网改用 DeepSeek Anthropic 兼容接口的内置 `web_search`，只需一把 DeepSeek Key；必须确认返回了搜索工具结果与可核对的 HTTPS 来源，不能把模型的离线回答冒充联网回答。搜索结果作为不可信材料传给分析模型，要求引用编号并在界面显示来源；网页内容不能触发本地写入。`page_age` 是页面更新信息，不能当作政策发布日期。`pause_turn` 续传时需原样保留搜索结果的 `encrypted_content`。政策、招生、求职建议只作为参考，不能把摘要当官方结论。个人 API Key 存 SecureStore；若日后面向其他用户发布，应改为带身份验证、配额和限流的服务端代理。模型返回的记账、待办、日程和课程都必须逐项校验，不能仅凭 TypeScript 类型断言写入。

**交互验证**：一屏七列课表的空白区左右滑动与课程拖动会竞争手势，子课程捕获拖动，父网格只识别明显横向滑动；需要在 iPhone 和 Android 真机分别测空白滑周、拖课、点课编辑、未弹键盘的 AI 输入栏。`expo export` 只能证明 bundle 可生成，不能证明手势优先级和玻璃可读性。

## 24. 动效审查：优先消除同屏手势落差

> 历史方案记录：以下 PanResponder 与不透明底板方案已被第 27 节替代，不应在新代码中复用。

课表原本只有 `onMoveShouldSetPanResponder` 和 `onPanResponderRelease`，中间没有 `onPanResponderMove`：用户滑动时整页不动、松手才换周。这是可验证的手感断点。保留现有 PanResponder（避免为单一手势增添依赖），用共享位移让课表跟手移动；只在开始滑动时渲染相邻周预览，达到阈值才反馈触感，放手后过渡到目标周，否则回弹。预览放在当前页下层，当前页滑动期间加不透明底板，避免两层半透明玻璃课程文字透叠。预览方向由 ref 管理，不能把 `previewDelta` 放进 PanResponder 的重建依赖里，否则拖动中途替换 responder。

这次审查还确认了 AI 消息气泡的入场、布局弹簧和自动滚动并行；去掉布局弹簧和重复的延迟滚动，只保留消息淡入与内容高度变化时的一次滚动。首页入场间隔缩短，开关与分段控件共用无过冲弹簧语义。数值变化采用子层轻淡入，原生 `GlassView` 的祖先仍只做 transform；给整张玻璃卡或整页统一加 opacity 不是安全的通用解法。数据页内容无 `exiting` 不等于必然出现空帧，不能仅凭静态代码就套用退场透明度动画。

时间线按每节课的实际开始/结束时间在等高节次行中插值，仅在当日上课时段显示，课间不伪装为连续的真实时间轴。真机复核重点：空白区域滑周、取消滑动回弹、快速反向滑动、周次 1/30 边界、课程拖动与纵向滚动、减少动态效果开启时，以及 iOS 原生玻璃与 Android 模拟玻璃的层叠可读性。

## 25. 课程性质不能靠课程名猜，先复用教务证据

成绩页的「必修课 GPA」需要逐门判定课程性质，但同名课程对不同专业、培养方案或学年可能有不同要求。学校公开的学籍规定给出“所修课程”的一般平均学分绩点；学院推免规则又可能单独使用“必修课程平均学分绩点”。公开文件能说明统计口径，不能据此判定某位学生的单门课程性质。参考 [湘潭大学本科学生学籍管理规定](https://xxgk.xtu.edu.cn/info/1030/1475.htm) 与 [法学学部 2026 年推免实施细则](https://law.xtu.edu.cn/info/1121/6109.htm)。

自动识别的证据顺序：成绩记录的明确课程性质 > 同次课表中相同课程代码的明确性质 > 同学期、同名且来源一致的性质。冲突标签、跨学期仅同名、以及只有课程名称的情况保持 `unknown`，不计入必修课 GPA。旧数据若保存了明确 `courseNature` 可自动恢复；`categoryManual` 更正永远优先。别把 DeepSeek 的推测当教务事实；未来若接培养方案文档，必须核对专业、入学年和原文课程代码，再提供来源与纠错入口。

## 26. 成绩总表打印页与实际成绩载体分离

湘大新教务的「信息查询 → 成绩总表打印（主修）」（`N558020`）入口页是学生记录选择表，只有学院、年级、专业等身份字段和「打印」按钮；详细成绩在点击后生成的独立 PDF 中。检查入口页 DOM 时不能因为看见表格就误以为拿到了成绩行。浏览器内置 PDF 查看器未向页面 DOM 暴露文字，缩小的一页预览也不足以可靠辨认字段。不得把学生姓名、学号、成绩或包含这些内容的 PDF URL 写入仓库和调试日志。

后续接入前先用脱敏样本确认 PDF 的真实列名、课程性质、学分、单课绩点与汇总口径，再决定是否实现本机 PDF 解析；解析失败要保留现有成绩查询接口的结果，不能静默覆盖。若使用视觉模型读取成绩单，应让用户在 App 内明确选择并同意将该 PDF 发送到指定模型服务，不能把已登录的教务 PDF 在后台自动上传。教务课程性质仍优先于 AI 推断。

## 27. 课表换周与拖课的手势不能混在 JS 线程

**现象**：PanResponder 在 JS 线程逐帧给 `weekDragX` 赋值；滑动中首次改变方向还会 `setPreviewDelta`、挂载整周课表。动画因此跟手慢一拍。为了遮住两个透明玻璃层叠的文字，旧实现又给移动页加了 `theme.background` 不透明底板，换周时看起来突然变白。课程块只移动约 10 px 就抢走横向手势，也妨碍换周和纵向滚动。

**修复**：按 Expo SDK 57 兼容版本安装 `react-native-gesture-handler`，在应用根节点放 `GestureHandlerRootView`。周切换和课程拖动改用 Gesture API + Reanimated worklet；横向位移在 UI 线程一比一更新，松手只做一次短时补齐或无过冲回弹。前、当前、后三周预先排列在裁剪区内，滑动中不做 React 状态更新或临时挂载。**最外层原生玻璃卡固定不动**，只移动内部网格轨道；不要为了掩盖玻璃叠层而引入白色不透明底板。课表卡关闭通用布局动画，避免状态交换时与轨道位移叠加。

课程手势使用 `activateAfterLongPress(200)`；200 ms 内的横向滑动交给换周，纵向滑动交给滚动。子手势用 `blocksExternalGesture` 让父层在拖课已启动时等待；拖动落点仍只提交一次位置，取消时短暂归位。换周阈值与边界继续复用 `src/week-swipe.ts` 的纯函数，并在手势速度单位从 px/s 转换为 px/ms 后调用，避免 UI 与测试口径漂移。

参考 [expo-glass-tabs](https://github.com/davidmokos/expo-glass-tabs) 的 UI 线程跟手与只在松手时导航的交互思路，以及 [RNGH Pan 手势文档](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/pan-gesture/)。`react-native-sortables` 适合自由列表重排，不直接适用于固定七列十二节网格；Skia shader 和 SwiftUI Mesh Gradient 会改变 Expo Go 测试条件，本轮不引入。以后先查是否有手势中 `setState`、是否在移动原生玻璃祖先、是否对同一节点同时做 transform 与 layout 动画，再调弹簧参数。

**待真机验收**：iPhone Expo Go 上分别试空白处慢滑、课程上快速横滑、按住课程 200 ms 后拖动、课表纵向滚动、快速反向滑动、第 1/30 周边界、深色/自定义背景与系统减少动态效果；Android 也要试手势优先级。静态打包通过不代表 60 fps 已被证明。

## 28. 全局动效升级：触点跟手，内容延后切换

底栏原先只在导航状态变化后才开始弹簧移动，手指横向拖过时选中胶囊不动；图标和文字颜色则瞬间跳色。分段选择器有同样的落差。参考 [expo-glass-tabs](https://github.com/davidmokos/expo-glass-tabs) 的交互原则，在现有导航结构上自行实现 `Gesture.Race(Pan, Tap)`：Pan 在 UI 线程把胶囊位置直接映射到触点，跨过选项中心给一次触感，**松手后才切页面或内容**，取消时回到原选项；Tap 保持正常点击，子 Pressable 保留无障碍激活。重复 Tap/Pan 事件在 JS 导航入口短时去重。选中图标双层淡变、文字颜色随胶囊位置插值，避免胶囊在移动而内容已经跳色。触点中心与边界算法收口到 `src/selection-geometry.ts` 并用窄屏、宽屏和未测量宽度测试覆盖。

参考 [pressto](https://github.com/enzomanuelmangano/pressto) 的按压即反馈思路，把全局 `MotionPressable` 的按下收缩缩短到约 100 ms、抬起用统一弹簧收尾；不要给每个组件随意加大幅缩放。首页待办完成时只淡出文字层，专注计时的呼吸幅度降到 1.012，避免一个页面平静、另一个页面不停弹跳。所有新动效继续遵守系统“减少动态效果”。原生玻璃的祖先只做 transform；图标、文字子层才做 opacity。

没有直接安装 [liquid-glass-screens](https://github.com/Appllama/liquid-glass-screens) 的 Skia 着色器或 [expo-ios-mesh-gradient](https://github.com/rit3zh/expo-ios-mesh-gradient) 的 SwiftUI 原生组件：前者明确不支持 Expo Go，后者要求原生构建，本阶段保留用户现有的 iPhone Expo Go 测试链路。`react-native-sortables` 适合自由列表重排，不能无校验地移植到固定课表；`native-springs` 的弹簧参数可参考，但不应为了更多动画引入持续运行的 Skia 图层。开源设计用作研究参考，避免复制非兼容许可的视觉/资产。

**真机验收**：快速点五个底栏、横向划过底栏后松手、划到边缘取消、VoiceOver 点标签、键盘打开时 AI 输入栏仍无遮挡；分段控件快速连续切换、纵向滚动时不误触、深色和降低透明度、Android 胶囊回退。`expo export` 和 TypeScript 通过只能证明构建正确，不能代替手感测试。

## 29. Expo Go 红屏：Worklets 不能复制 `FiberNode`

全局动画上线后，分段控件在 iPhone Expo Go 中报 `[Worklets] Cannot copy value of type FiberNode`。`items` 数组带有 React 图标节点，而手势的 UI 线程回调写了 `items.length`；Babel 会捕获整个 `items`，不只捕获长度，运行时序列化才失败。改为在 JS 渲染阶段先提取 `count` 数字与纯字符串 `values`，worklet 只使用 `count`。底栏手势同理，不直接引用包含导航对象的 `state.index`，先提取 `selectedIndex`。

**教训**：TypeScript 和 `expo export` 都可能通过，但这类对象复制在真机运行时才炸。新增 `npm run test:worklet-closures`，检查 Babel 实际生成的 `__closure`，禁止捕获 `items`、`state`、`navigation`、图标等对象。以后改手势先跑这个测试，再用 Expo Go 点开每个含手势的页面。

## 30. 换周完成时不能先换内容、再归零位移

三页课表轨道滑到相邻页时，旧实现先 `setWeekOffset` 更新三页内容，再由 `useLayoutEffect` 把共享位移重置为 0。React 提交和 UI 线程共享值归零不是同一个原子操作；中间一帧可能露出「再下一周」，看起来就是闪一下。修复后把轨道拆成按周数 keyed 的 `WeekTrack`：旧轨道停在目标周，新轨道一挂载就以该周为中页、位移初始为 0。外层 `Card` 和背景继续常驻，避免整块原生玻璃重建。课块在原生玻璃下面保留低透明度的同色底层，材质重绘时也不会突然变成透明洞。

**真机验收**：连续快滑、按钮连续换周、第 1/30 周边界、半途取消、浅色/深色/自定义背景都要看；静态测试只能确认周边界逻辑与打包，无法证明 iPhone 上的帧连续性。

## 31. Expo 二维码出现，不代表 iPhone 账号验证通过

2026-09-30 再次出现手机提示「Expo Go 已登录 start66613，但 Expo CLI 未登录」。当时受限网络中的 `npx expo whoami` 请求 Expo 官方服务返回 `UnexpectedServerError`，于是误用 `EXPO_OFFLINE=1` 启动；电脑上清单 HTTP 200，却仍无法通过 iPhone Expo Go 的账号检查。二维码和 HTTP 200 都不是充分验证。使用可连接 Expo 官方服务的环境运行 `npx expo whoami`，确认 `start66613`，并检查 iOS manifest 的 `extra.expoClient.owner` 也是该账号后，手机才能打开。官方排障说明还明确指出 CLI 不会在终端提示账号不匹配，错误只出现在手机上。

以后统一用 `npm run start:iphone`：它禁止离线模式、核对 CLI 账号、启动 LAN 服务并验证 iOS 项目清单；任一环节失败就停止并提示，不给用户一个看似可扫但无法运行的二维码。不要把沙箱网络失败误判为账号退出，也不要为了绕过 Expo API 错误而开启离线模式。参见 [Expo Go 登录排障](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/) 与 [Expo CLI 认证说明](https://docs.expo.dev/more/expo-cli/)。

## 32. 背景必须挂在可见页面层；先区分开发模式与真机掉帧

**现象**：首页与其他标签页切换时，壁纸像是断开或重新出现；用户也感觉整体帧率偏低。旧 `Screen` 每页单独挂载同一张图片、渐变和光晕，标签页视图又有不透明场景底色，并在每次重新聚焦时平移整个页面 12 px。课表的时间线每 30 秒通过父页面 `setNow` 重绘三周课表和大量原生玻璃课程块。这些是可由代码直接确认的成本，不能把所有卡顿归因于 Expo 热点传输。

**踩坑与修复**：第一次把壁纸、渐变、光晕放到导航根层的 `AppBackdrop`，并把 Stack 与 Tab 场景设置为透明。静态导出通过，但 iPhone 真机报告所有页面背景消失、重新设置也无效：原生导航场景仍盖住了根层壁纸。不要再把原生 Stack 后方当作可见背景。现在 `AppBackdrop` 是唯一的背景实现，但由每个可见 `Screen` 渲染，读取同一份全局设置；Stack/Tab 场景恢复不透明底色作为兜底。首页主卡仍跟随用户主色。删除切换标签时整页平移的重复动画，保留底栏选中胶囊动效；课程当前时间线拆成局部组件，仅在课表聚焦时每分钟更新，避免定时刷新三周网格。自定义背景仍在“保存我的设计”后全局生效。

**验证**：`npm run test:background-placement` 防止再次把壁纸移到导航层后方；但静态测试、类型检查和 iOS/Android 打包都**不能证明壁纸在原生导航上可见**。用 `npm run start:iphone` 测开发版，再用 `npm run start:iphone:perf` 在另一端口启动 `--no-dev --minify` 对照；后者仍是 Expo Go 测试，不等于正式原生 Release。真机需先确认默认壁纸与自定义图片在首页、课表、AI、数据、我的五页都能显示，再查首页滚动、切页、拖课和滑周的 JS/UI FPS。详见 [Expo 开发与生产模式](https://docs.expo.dev/workflow/development-mode/) 和 [React Native 性能概览](https://reactnative.dev/docs/performance.html)。

## 33. 设计审计要先验证，原生动画库不能直接代替 Expo Go

2026-10-01 审计发现浅色主题的 `surfaceAlt` 与页面底色完全相同，经典原生模式中的分段轨道、输入框和未选中态缺少层次；改成可叠在白卡与灰页上的半透明填充色。这个 RGBA 是设计近似值，不是 UIKit 的动态 `tertiarySystemFill`。`Card` 的 28px 实际圆角和 26px token 分叉，现已统一；玻璃卡用细边，经典卡用轻阴影，不再两者叠加。滚动内容给悬浮底栏留出的空间改用栏高、安全区和间距共同计算，避免固定 126px。空状态改用统一单色图标。GPA、金额、倒计时等数字使用 `tabular-nums`；中文大标题清掉负字距和明显过粗字重，但不能机械地把所有数字、图标字重也压到 600。

背景的「光晕」原先只是 4% 透明的实心圆，有硬边且叠层过多。现在保留图片与单层渐变；自定义图片单独使用低遮盖渐变，特别注意经典模式原来完全不透明的背景渐变会盖住用户图片。炫彩主题在各个 `Screen` 中使用三色背景渐变，首页主卡也使用三色；这是比全局只换一个紫色 token 更一致的呈现，但复杂组件的主色仍是单色，避免牺牲可读性。新增 `test:ui-tokens` 和背景回归断言。

依照 [react-native-ease](https://github.com/AppAndFlow/react-native-ease) 自己的说明，Ease 适合状态驱动的静态属性变化，**不适合课表拖动、周切换或布局动画**，这些继续使用 RNGH + Reanimated。设置开关在含 Ease 的原生构建中使用它；Expo Go 保留现有实现。[Tickle](https://github.com/Renegades-Studio/react-native-tickle) 是 iOS-only Nitro 模块，原生构建可用于选择触感，Expo Go 和 Android 回退到 `expo-haptics`；连续触感尚需真机原生构建验证，不能把装了依赖说成已经有连续触感。[expo-glass-tabs](https://github.com/davidmokos/expo-glass-tabs) 已作为源码参考和依赖加入，但其现成 `ProgressiveBlur` 使用多层 BlurView，现成底栏也不直接支持本应用的经典模式与键盘隐藏规则；不在已报告掉帧的版本里盲目整体替换。

**兼容边界**：第三方原生模块不会出现在苹果 App Store 下载的 Expo Go 里。用 `Constants.executionEnvironment` 隔离运行路径，不能在应用入口静态导入 Tickle（其模块加载时就创建 Nitro hybrid object）。旧开发包缺少新模块时仍应回退，但安装依赖、TypeScript 通过与 Metro 导出成功都不能证明自定义原生包的链接和运行正确；要另做开发构建并在 iOS/Android 真机测试。当前 iOS/Android `expo export`、类型检查和回归脚本可作为基础门槛。

## 34. 底栏高亮动了，页面没动，不算切页动画

底栏原本有跟手胶囊，但 `app/(tabs)/_layout.tsx` 的 Bottom Tabs 明确配置 `animation: 'none'`，导致首页切 AI 记等操作都是内容硬切。React Navigation 的 Bottom Tabs 支持 `fade`、`shift` 与自定义 `sceneStyleInterpolator`；内置 `shift` 同时对整个场景做 opacity，会碰到本项目原生 GlassView 祖先透明度导致材质消失的旧问题。改为自定义全宽水平场景位移，上一页和下一页在 260ms 内对接，底栏保持静止；转场只做 transform，不给玻璃场景做 opacity。按系统“减少动态效果”关闭转场，避免为了视觉效果牺牲无障碍体验。参见 [React Navigation Bottom Tabs 动画文档](https://reactnavigation.org/docs/bottom-tab-navigator/#animations)。

真机验收要连续试首页↔AI 记、相邻与跨多个标签、快速反向点击、深色/自定义壁纸、键盘打开时切页，以及 Android；特别看两页边界是否闪白、原生玻璃是否消失、滑动课表时是否被误认为标签切换。导航转场用原生驱动的 transform，但两个玻璃页面短时同时显示，静态测试与打包通过仍不能证明帧率，必要时减短位移或时长，而不是叠加模糊/淡入。新增 `npm run test:tab-transition` 防止回到 `animation: 'none'` 或误加场景 opacity。

## 35. 底栏无级滑动与课表当前时间标记

底栏原本就能用分数位置驱动胶囊，但横向移动超过 7px 后 Pan 才接管，容易让首段拖动显得迟钝。现在改为 3px 接管，移动中仍直接把触点映射到胶囊位置、图标和标签连续插值，并在两项中间做最多约 6% 的轻微拉伸；选择触感增加 0.58 格迟滞区，避免手指在两项边界轻微抖动时反复振动。跨越标签中心只发选择触感，不在每个经过的标签上立刻导航。松手后才就近落位并触发页面转场，否则中途连续打开多个含原生玻璃的页面会造成跳动和掉帧。快速拖过全栏、反向拖回、从非当前图标起拖、最后停在原标签都要真机试。

旧「当前时间线」用醒目的红色短线压在今日课程卡上，既遮文字也没有说明。现在使用主题色的极细线与左侧小圆点，线先于课程卡渲染，让课程内容保持最上层；课表顶部用同色圆点解释细线代表今天当前时间，仅本周上课时段显示。圆点放在时间列边界，不遮住节次与时间文字；不要为了永久显示而捏造课间的线性时间位置。新增 `test:fluid-tab-and-time-indicator` 防止高亮退回离散跳动、时间线重新变红或盖住课程。

## 36. 小标签的玻璃材质不能以可读性和帧率为代价

首页概览状态标签、AI 示例/联网开关与课表周次操作原本仍是纯色小块。玻璃模式下统一让这些小控件使用 `GlassBackdrop`，但字色改为当前主题的主文字色，以实心色点或图标保留语义颜色；经典模式仍使用原底色，避免用户切换模式后两个样式混杂。首页渐变卡上的周数徽标保留高对比样式，不为了覆盖率强加一层玻璃。

小控件不能每个都加实时模糊：Android 或不支持原生 GlassView 的设备使用 `lightweight` 透明底色与边缘高光，iOS 可用时仍走原生液态玻璃。这样避免 AI 示例横排和课表按钮同时产生多层 `BlurView`；上线前仍需在 iPhone 深/浅色、护眼及自定义壁纸、Android 真机分别核对文本对比度和滚动帧率。`npm run test:ui-tokens` 加入对应回归检查。

## 37. 玩梗主题要可逆，AI 文案不能污染真实数据

嘉豪模式是 `settings.jiahaoMode` 的可选呈现层，开启时使用单独生成的雨夜壁纸、紫色深色调、底栏/功能/课程分类图标与简短嘉豪文案；关闭后读取原有头像、背景、主题色和记录，不重写课程名、教师、消费或成绩。课程分类图标按 `course.icon` 或类型映射，主入口和设置项使用各自独立的资源键，不再靠标题字符串推测图标。生成素材属于本地个人测试的同人视觉，发布到应用商店前要替换为有授权的原创角色。

AI 嘉豪语气只能出现在回答摘要、提示和确认按钮；模型的结构化金额、课程时间、成绩以及网页来源仍按原字段提取并校验。所有 AI 写入先展示预览、由用户确认，并提供撤销。快速连续点击确认可能重复派发写入，所以提交入口必须用同步 ref 守卫，不能只依赖下一次 React 状态更新。联网问答也不自动写入本地数据。

## 38. 从演示数据迁移到真实周报时，先留回退副本

早期种子课程、消费和 GPA 容易让用户以为是真实记录。新安装使用空数据；旧数据升级时先把原始 JSON 留在 `campusflow.pre-migration.v1`，再移除已知演示 ID，保留被用户实际编辑过的示例课程。每周消费、待办、出勤和专注按本周日期过滤，没记录就如实显示空状态，绝不补造数字。备份导出不包含 AI 密钥，但 JSON 明文仍含个人生活数据；导入前需校验结构、提醒覆盖，并在本机保留恢复前副本。iOS/Android 静态导出与 TypeScript 通过后，还要在真机核对文件分享、恢复和原有数据是否完整。

## 39. 产品宣传片：可重渲染不等于通过审片

2026-10-12 为 CampusFlow 建立独立 `media/promo` 制作工程：HyperFrames 制作可寻帧的液态片头，Remotion 编排九场景横竖屏版本，Seedance 技能提供中文镜头提示，video-use 用于切点与成片检查。Seedance Prompt Skill 不是模型接口，安装技能不能声称已调用 Seedance 生成视频；video-use 的原始口播转写依赖用户自己的 ElevenLabs Key，本片没有原片口播，使用新生成的中文旁白，无需 ASR。

**环境排障**：GitHub 下载方式遇到证书问题时，技能安装器可改用 Git；video-use 安装根目录后需核对 helpers 是否完整，稀疏检出可能只复制入口。Remotion 自带的精简 FFmpeg 能编码视频，但缺少部分音频滤镜；配套 FFprobe 也可能只是轻量替代物。切点缩略图、响度分析要使用经核对的完整 FFmpeg/FFprobe。浏览器自动下载失败时显式指定本机 Edge，不要靠重复安装等待解决。

**视觉验收**：网页截图没有 iPhone 状态栏，直接套带“灵动岛”的手机壳会挡住标题，必须给截图留顶部安全空间；横屏与竖屏分别检查，不能仅缩放同一布局。标题、Logo、字幕轨、课程单元的容器高度都要在代表帧及转场前后核对。课程内容使用合成演示数据；还原的交互动效应明确为产品演示，不冒充 iPhone 原生玻璃的实机录屏，也不能把暂停的小组件、未验证的自动支付记账包装成已完成能力。

**声音验收**：旁白先按镜头窗口控制长度，不能在最终一句机械加速；长字幕按语义拆分，防止竖屏出现孤字。原创配乐在旁白窗口降低音量，最后做两遍响度归一化，母带留 -1.5 dBTP 余量。AAC 编码会改变峰值，所以最终 MP4 必须再测，WAV 合格不能替代成片合格。关键切点用 `timeline_view.py` 同时查看画面与音频波形，尾部轻淡出是有意设计，不等同于意外静音。

制作源文件、必要资产与质量记录可同步 GitHub；大型成片、临时导出、依赖目录和音频缓存不入库。应用代码保持不变，别为宣传素材绕过真实数据或改动用户已登录的浏览器。成片参数与审片结果见 `media/promo/edit/qa-report.md`。

## 40. 三维产品片：首帧材质、字体与真实制作基线

2026-10-13 用户要求拒绝接手作者的 39 秒剪辑，恢复原作者版本并扩展。先备份 MP4 与源码，再按有证据的作者 30 秒时间线恢复，而不是对整个工作区做 Git reset。历史交付和另一作者的验收记录继续保留；新片另命名、另写验收。广告定位改为“重新定义课程表”“湘大学生专供”，同时注明独立非官方应用，不能把受众定位写成学校官方背书。

**3D 首帧字体**：`@remotion/three` 在渲染时使用手动帧，不会因为任意子组件的异步 `setState` 自动再渲染。原先字体 `load` 后设 `ready=true`，立即 `continueRender`，关键帧可出现空白卡片，虽然 DOM 标题、后续实时预览和类型检查都正常。改为共享字体加载 Promise，R3F 文本用 React `use()` 参与 Suspense，字体就绪后才生成首帧纹理；同时用 `document.fonts.check` 验证正常与粗体。不要在会被 Suspense 丢弃的 render-time state initializer 中创建独立 `delayRender`，否则会泄漏句柄并造成 28 秒超时。完整关键帧和冷启动寻帧检查不能省。

**物体遮挡**：机身倒角、前框和屏幕的真实 Z 坐标必须核算；屏幕放在前框背后时，材质会正常显示但 UI 消失。文字、截图、彩色底与玻璃边缘是不同层，UI 不能为了透明材质失去可读性。大标题也要检查镜头拉近时的手机轮廓，不能只看最后落定帧。白场之间避免无意黑→白变化，AI 结果展示应留出收尾时间。

**制作环境**：Windows 用户盘临时空间耗尽会表现为浏览器初始化、临时 bundle 或渲染失败。为本项目的 subprocess 设 D 盘 `TEMP/TMP`，不改系统级环境变量，不清空用户缓存。正式渲染使用固定 bundle + 本机 Edge + ANGLE，保持 Remotion 包版本一致；所有动效由帧驱动，不引入 RAF、`useFrame()` 或随机时钟。音视频临时输出、依赖和指定歌曲缓存都排除于 Git。

**声音与宣传事实**：指定歌曲的公开 BPM 可能有半拍/双拍口径冲突，用实际音频检测切点；连续音乐不必在每个视觉剪辑点切断，只在音频本身边界做短淡入淡出，再测最终 AAC 的 LUFS 与峰值。早八通知提醒与系统原生闹钟不是同一能力，产品片不应混称；GPA 卡明确必修统计口径。音乐的用户素材授权不等于商用发行许可。最终色彩转换应实际把 full-range BT.601 转为 limited BT.709，不能只改元数据标签。

## 41. 宣传材质和 DIY：状态正确比漂亮关键帧更重要

用户要求重做旧设计时，先另存成片与源码，以新组件替换时间线和预览入口，不能只另建组件却仍注册旧镜头。大手机与主卡颜色变化比三台小手机陈列更能说明 DIY；详细展示选颜色、换壁纸、调整可见度，给动作留稳定停留，而不是让设置只作为背景装饰。

**颜色类型**：Remotion 的 `interpolateColors()` 返回 `rgb(...)`，不能照 HEX 色的用法拼接 `CC` 或 `19` 表示透明度；浏览器会丢弃非法背景，TypeScript 未必报错。统一用解析 HEX/RGB 的 `withAlpha()` 生成合法 `rgba(...)`，检查成片里的彩色主卡确实存在。连续地从一种颜色混到下一种颜色，也会使选中“浅蓝”却长期显示紫色；每个选项应稳定 hold，仅在切换短窗口插值，选中边框与实际渲染状态同步。

**透明材质**：透光需要背景对齐，卡片复制的背景必须与底图使用相同尺寸、裁切和负偏移。模糊、白色底的透明度、薄边缘高光连续变化，而文字在另一层保持对比度；关闭材质要回到不透明经典底色，不能只改开关图标。背景可见度也应传入内嵌卡片的取样层，避免滑杆只影响卡片外的壁纸。影片中这些是产品动效还原，不冒充原生实机材质。

**独立验收**：检查选项和结果的一致性，尤其是第一张、过渡中、稳定态、开关关闭/开启和最后一张，不只看有没有报错。视觉稿延长后要重建音轨、同步 EDL，自动验证逐段无空隙且总帧数一致，再测最终 AAC/色彩。官方提供静止画并不自动证明商业广告许可；测试可以保留来源，正式推广应更换具备明确授权的背景和音乐。

## 42. 产品片要让人理解功能，不只堆镜头

快速三秒手机旋转不能说明“一键导入”的实际价值。先展示本人正常完成学校认证，再读取课表和成绩，最后稳定显示两个结果；核心AI按设置、输入、预览、确认、写入/撤销、分析建议连续讲清楚，同系列不被其他场景打断。大手机只是手段，还要放大关键输入和结果卡，缩到约960px宽仍能读；辅助教室/老师小字不应拿来证明全部界面都可读。

**转场**：统一舞台的亮度与手机锚点，36帧缓动淡变让相关界面连续。退出画面保持不透明，由下一画面的透明度控制标准混合，避免双方同时淡出露出底层并产生亮度闪变。这是HTML影片合成策略，不要直接搬到原生GlassView祖先容器。独立标题宜先退场再进入，别在同一点把两句不相关大字长时间叠起来。阅读时间优先于每个视觉切点强制跟鼓点，配乐保持连续，停止编造“节拍完全对齐”。

**时长**：TransitionSeries会缩短净片长，EDL显式记录每段`transitionOutFrames`；净总长为段长之和减交叠，不能照旧把所有duration直接相加。独立预览时长与主序列保持一致，注册各个新镜头，避免编辑器仍点到旧版构图。

**宣传事实**：密钥本机存储不代表发送给模型的成绩也永不离机；本次未联网的演示不能伪造搜索来源；图片识别依赖相应模型/代理；一次早八通知不画成长期开关。湘大专供是目标受众，不冒充学校官方背书。影片源数据是可寻帧演示，不是原生实机录屏或帧率证明。

**长片恢复**：遇到Chromium `Target closed`且进度停滞时，先单独出同一帧，区分素材/组件错误和长时间渲染进程故障。中断的pre-encode MP4可能缺moov，不能交付或只改后缀。保留锁定bundle，降低并发按明确的全局frameRange拆分，检查每块帧数，视频无损拼接后添加完整连续音轨，再做实际色彩转换/最终AAC测量。视频切块边界不等于音乐切点，不要为此把连续BGM也切开；恢复接缝要检查前后帧与时间戳。
