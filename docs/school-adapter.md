# 教务系统适配器约定

## 湘潭大学（已识别）

湘潭大学新教务是正方 V9，统一认证入口为 `https://jw.xtu.edu.cn/sso/zfiotlogin`。当前已确认以下菜单与页面：

- `N2151`：个人课表查询，`/jwglxt/kbcx/xskbcx_cxXskbcxIndex.html`
- `N2154`：按周课表查询，`/jwglxt/kbcx/xskbcxZccx_cxXskbcxIndex.html`
- `N305005`：学生成绩查询，`/jwglxt/cjcx/cjcx_cxDgXscj.html`
- `N309104`：平均学分绩点排名统计，`/jwglxt/cjpmtj/cjpmtj_cxPjxfjdpmtjIndex.html`
- `N358105`：考试信息查询，`/jwglxt/kwgl/kscx_cxXsksxxIndex.html`

App 的首版适配采用内置 WebView：用户在学校页面自行登录，App 复用 WebView 的短期 Cookie，从用户已查询并显示的表格中读取课表或成绩。App 不注入、不读取、不保存账号密码。若页面结构发生变化，更新 `app/school.tsx` 的 DOM 提取脚本与 `src/school-importer.ts` 的字段映射即可。

不要在外部浏览器与 App 之间复制 Cookie，也不要把 Cookie、页面原文或学生身份信息写入日志。

对于其他学校，正方、青果、强智、URP 或统一身份认证都有不同验证码、Cookie 和选课字段。需要无人值守同步时，`server/index.mjs` 可把同步请求转发给你控制的固定适配器地址 `SCHOOL_ADAPTER_URL`。

## 请求

适配器接受 `POST application/json`：

```json
{
  "school": "my-university",
  "studentId": "20260001",
  "password": "仅本次请求使用"
}
```

适配器不得记录明文密码。若学校使用二维码、短信、滑块或统一身份认证，应改用短期会话或让用户在学校官方登录页完成认证，不要绕过验证码。

## 响应

```json
{
  "courses": [
    {
      "id": "course-1",
      "name": "高等数学",
      "teacher": "周老师",
      "location": "博学楼 A302",
      "weekday": 1,
      "startPeriod": 1,
      "endPeriod": 2,
      "startTime": "08:00",
      "endTime": "09:40",
      "weeks": [1, 2, 3, 4],
      "color": "#5B67F1",
      "type": "major"
    }
  ],
  "grades": [
    {
      "course": "数据结构",
      "score": 91,
      "credit": 4,
      "gpa": 4,
      "courseNature": "专业必修",
      "category": "required",
      "semester": "2025-2026-2"
    }
  ]
}
```

## 推荐部署方式

- 适配器与 CampusFlow API 都必须使用 HTTPS。
- 用学校代码选择后端适配器，但目标地址只能来自服务端白名单，不能接受用户提交的任意 URL。
- 登录 Cookie 仅保存在一次同步请求内，完成后立即清除。
- 对同步接口做频率限制，并关闭请求体日志。
- 单门成绩的 `gpa` 必须是单课绩点，不是 `学分绩点`/质量点；若来源只有 `xfjd`，先除以学分。`courseNature` 保留教务原值，`category` 为 `required`、`elective` 或 `unknown`。
- App 目前展示的是「必修课 GPA」，选修只累计通过课程的学分；未知性质不混入必修 GPA，并允许用户更正。湘潭大学不同用途存在不同绩点口径，不能将本卡片误称学校唯一官方 GPA，具体以教务系统为准。
