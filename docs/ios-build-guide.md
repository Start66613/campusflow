# CampusFlow iPhone 免费七日签安装

当前测试方案由两部分组成：

1. Expo EAS 的云端 Mac 编译出**未签名 IPA**。
2. Windows 上的 AltStore Classic 使用你自己的免费 Apple ID 重签并安装。

免费签名通常有效 7 天；到期前在 AltStore 中刷新即可，应用本地数据不会因为续签而清空。这个测试包暂不包含桌面小组件，课表、AI、成绩、日历和通知等 App 内功能照常编译。

## 生成未签名 IPA

项目已经配置了 `altstore` 构建档案：

```powershell
cd "D:\软件开发\课程表\campusflow"
npx eas-cli build --platform ios --profile altstore --non-interactive --wait
```

构建会自动移除 Widget 扩展、禁用 Xcode 代码签名，并把生成的 `.app` 封装为 `CampusFlow-AltStore.ipa`。完成后从 EAS 构建页面下载 IPA。

## 用 AltStore Classic 安装

1. Windows 保持 AltServer、Apple 官方 iTunes 和 iCloud 正常运行。
2. iPhone 与电脑处于同一网络，首次安装建议连接数据线并在手机上点“信任此电脑”。
3. 打开 iPhone 上的 AltStore → `My Apps` → 左上角 `+`，选择 `CampusFlow-AltStore.ipa`。
4. 按系统要求开启开发者模式，并在“设置 → 通用 → VPN 与设备管理”中信任自己的 Apple ID。
5. 七天内打开一次 AltStore 刷新 CampusFlow；电脑上的 AltServer 需要可连接。

## 付费账号方案

以后若加入小组件、TestFlight 或 App Store，再使用 Apple Developer Program 和正式签名构建。正式配置仍保留在项目里，不影响当前的免费测试包。
