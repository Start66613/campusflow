import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { MotionPressable } from '@/components/motion';
import { parseZfCourseRows, parseZfGradeRows, type ZfRow } from '@/src/school-importer';
import { useApp } from '@/src/store';
import { useAppTheme } from '@/src/theme';

const SCHOOL_SSO = 'https://jw.xtu.edu.cn/sso/zfiotlogin';

type SyncState = 'waiting' | 'syncing' | 'success' | 'error';

const detectLoginScript = `
(function () {
  var isJw = location.hostname === 'jw.xtu.edu.cn' && location.pathname.indexOf('/jwglxt/') >= 0;
  var isLogin = /login|slogin/i.test(location.pathname) || !!document.querySelector('input[type="password"]');
  var hasShell = !!document.querySelector('#sessionUserKey, #topButton, .navbar, .navbar-header, [data-username]');
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'auth-state',
    authenticated: Boolean(isJw && !isLogin && (hasShell || /index_initMenu/.test(location.pathname))),
    url: location.href
  }));
})(); true;
`;

function currentTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return {
    xnm: String(month >= 8 ? now.getFullYear() : now.getFullYear() - 1),
    xqm: month >= 8 || month === 1 ? '3' : '12',
  };
}

function makeAutoSyncScript() {
  const { xnm, xqm } = currentTerm();
  return `
  (async function () {
    function send(message) { window.ReactNativeWebView.postMessage(JSON.stringify(message)); }
    function form(values) {
      return Object.keys(values).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(values[key]);
      }).join('&');
    }
    async function request(path, values) {
      var response = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: form(values)
      });
      var body = await response.text();
      if (!response.ok) throw new Error('接口返回 ' + response.status);
      if (/<!doctype|<html|login_slogin/i.test(body.slice(0, 300))) throw new Error('登录会话已经失效，请重新登录');
      try { return JSON.parse(body); } catch (_) { throw new Error('教务系统返回格式已变化'); }
    }

    try {
      if (location.hostname !== 'jw.xtu.edu.cn') throw new Error('尚未进入新教务系统');
      var courseRows = [];
      var scheduleErrors = [];
      var schedulePaths = [
        '/jwglxt/kbcx/xskbcx_cxXsKb.html?gnmkdm=N2151',
        '/jwglxt/kbcx/xskbcx_cxXsgrkb.html?gnmkdm=N2151'
      ];
      for (var index = 0; index < schedulePaths.length; index += 1) {
        try {
          var schedule = await request(schedulePaths[index], { xnm: '${xnm}', xqm: '${xqm}', kzlx: 'ck' });
          var rows = schedule.kbList || (schedule.data && schedule.data.kbList) || schedule.items || [];
          if (Array.isArray(rows)) courseRows = rows;
          if (courseRows.length) break;
        } catch (error) { scheduleErrors.push(String(error && error.message || error)); }
      }

      var gradeRows = [];
      var gradeError = '';
      var gradeQueries = [
        { xnm: '', xqm: '' },
        { xnm: '${xnm}', xqm: '${xqm}' }
      ];
      for (var gradeIndex = 0; gradeIndex < gradeQueries.length; gradeIndex += 1) {
        try {
          var query = gradeQueries[gradeIndex];
          var grades = await request('/jwglxt/cjcx/cjcx_cxDgXscj.html?doType=query&gnmkdm=N305005', {
            xnm: query.xnm,
            xqm: query.xqm,
            '_search': 'false',
            nd: String(Date.now()),
            'queryModel.showCount': '500',
            'queryModel.currentPage': '1',
            'queryModel.sortName': '',
            'queryModel.sortOrder': 'asc',
            time: '0'
          });
          var gradeItems = grades.items || (grades.data && grades.data.items) || grades.rows || [];
          if (Array.isArray(gradeItems)) gradeRows = gradeItems;
          if (gradeRows.length) break;
        } catch (error) { gradeError = String(error && error.message || error); }
      }

      if (!courseRows.length && !gradeRows.length) {
        throw new Error(scheduleErrors[0] || gradeError || '本学期暂时没有查到课表或成绩');
      }
      send({
        type: 'auto-sync-result',
        payload: { courseRows: courseRows, gradeRows: gradeRows, semester: '${xnm} 学年 · ${xqm === '3' ? '第一学期' : '第二学期'}', courseTerm: { xnm: '${xnm}', xqm: '${xqm}' } }
      });
    } catch (error) {
      send({ type: 'auto-sync-error', error: String(error && error.message || error) });
    }
  })(); true;
  `;
}

export default function SchoolScreen() {
  const theme = useAppTheme();
  const app = useApp();
  const webRef = useRef<WebView>(null);
  const startedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<SyncState>('waiting');
  const [detail, setDetail] = useState('请登录湘潭大学统一认证，成功后会自动读取课表和成绩。');

  const startSync = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setState('syncing');
    setDetail('已登录，正在读取本学期课表与成绩…');
    webRef.current?.injectJavaScript(makeAutoSyncScript());
  }, []);

  const retry = () => {
    startedRef.current = false;
    setState('waiting');
    setDetail('正在重新检查登录状态…');
    webRef.current?.injectJavaScript(detectLoginScript);
  };

  const onMessage = async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        authenticated?: boolean;
        error?: string;
        payload?: { courseRows?: ZfRow[]; gradeRows?: ZfRow[]; semester?: string; courseTerm?: { xnm: string; xqm: string } };
      };
      if (message.type === 'auth-state') {
        if (message.authenticated) startSync();
        return;
      }
      if (message.type === 'auto-sync-error') {
        setState('error');
        setDetail(message.error || '教务系统暂时无法读取，请重试。');
        return;
      }
      if (message.type !== 'auto-sync-result' || !message.payload) return;
      const courses = parseZfCourseRows(message.payload.courseRows ?? []);
      const grades = parseZfGradeRows(message.payload.gradeRows ?? [], message.payload.semester, message.payload.courseRows ?? [], message.payload.courseTerm);
      if (!courses.length && !grades.length) {
        setState('error');
        setDetail('接口已连接，但没有识别到课程或成绩字段；教务页面可能刚刚更新。');
        return;
      }
      if (courses.length) app.mergeSchoolCourses(courses);
      if (grades.length) app.replaceGrades(grades);
      setState('success');
      const classified = grades.filter((grade) => grade.category !== 'unknown').length;
      const pending = grades.length - classified;
      setDetail(`已自动导入 ${courses.length} 门课程、${grades.length} 门成绩；自动识别 ${classified} 门课程性质${pending ? `，${pending} 门待教务资料补全` : ''}。数据只保存在本机。`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setState('error');
      setDetail('教务数据解析失败，请点“重新同步”再试一次。');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <MotionPressable onPress={() => router.back()} style={[styles.close, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.closeText, { color: theme.text }]}>×</Text>
        </MotionPressable>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]}>湘大教务自动同步</Text>
          <Text style={[styles.subtitle, { color: theme.secondary }]}>登录一次，自动完成导入</Text>
        </View>
        {state === 'error' || state === 'success' ? (
          <MotionPressable onPress={retry} style={[styles.retry, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.retryText, { color: theme.primary }]}>重新同步</Text>
          </MotionPressable>
        ) : <View style={styles.headerSpacer} />}
      </View>

      <View style={[styles.status, { backgroundColor: state === 'error' ? `${theme.red}16` : theme.primarySoft, borderColor: state === 'error' ? `${theme.red}38` : `${theme.primary}24` }]}>
        {state === 'waiting' || state === 'syncing' ? <ActivityIndicator size="small" color={theme.primary} /> : (
          <View style={[styles.statusDot, { backgroundColor: state === 'success' ? theme.green : theme.red }]} />
        )}
        <Text style={[styles.statusText, { color: state === 'error' ? theme.red : theme.text }]}>{detail}</Text>
      </View>

      <View style={[styles.webWrap, { backgroundColor: theme.surface }]}>
        <WebView
          ref={webRef}
          source={{ uri: SCHOOL_SSO }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => {
            setLoading(false);
            webRef.current?.injectJavaScript(detectLoginScript);
          }}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={(request) => {
            if (request.url === 'about:blank') return true;
            try { return new URL(request.url).hostname.endsWith('.xtu.edu.cn'); } catch { return false; }
          }}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          originWhitelist={['https://*']}
          style={{ backgroundColor: theme.surface }}
        />
        {loading ? <View pointerEvents="none" style={[styles.loading, { backgroundColor: `${theme.background}B8` }]}><ActivityIndicator color={theme.primary} /></View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { minHeight: 64, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heading: { flex: 1 }, title: { fontSize: 17, fontWeight: '600' }, subtitle: { fontSize: 11, marginTop: 2 },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, closeText: { fontSize: 28, lineHeight: 30, fontWeight: '300' },
  retry: { minHeight: 36, borderRadius: 18, paddingHorizontal: 12, justifyContent: 'center' }, retryText: { fontSize: 12, fontWeight: '700' }, headerSpacer: { width: 38 },
  status: { marginHorizontal: 14, marginBottom: 10, minHeight: 52, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 9, height: 9, borderRadius: 5 }, statusText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  webWrap: { flex: 1, marginHorizontal: 10, marginBottom: 8, borderRadius: 24, overflow: 'hidden' },
  loading: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
