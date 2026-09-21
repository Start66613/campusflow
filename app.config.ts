import type { ConfigContext, ExpoConfig } from 'expo/config';

const temporaryBundleIdentifier = 'com.IRfT.x7lP';

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseConfig = config as ExpoConfig;
  const liteBuild = process.env.CAMPUSFLOW_LITE_BUILD === '1';
  const unsignedBuild = process.env.CAMPUSFLOW_UNSIGNED_BUILD === '1';
  const noWidgetBuild = process.env.CAMPUSFLOW_NO_WIDGET === '1';

  if (!liteBuild && !unsignedBuild && !noWidgetBuild) {
    return baseConfig;
  }

  const extra = JSON.parse(JSON.stringify(baseConfig.extra ?? {}));

  if (extra.eas?.build?.experimental?.ios) {
    delete extra.eas.build.experimental.ios.appExtensions;
  }

  return {
    ...baseConfig,
    ios: {
      ...baseConfig.ios,
      bundleIdentifier: liteBuild ? temporaryBundleIdentifier : baseConfig.ios?.bundleIdentifier,
    },
    plugins: (baseConfig.plugins ?? []).filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return name !== 'expo-widgets';
    }),
    extra: {
      ...extra,
      liteBuild,
      unsignedBuild,
      noWidgetBuild,
    },
  };
};
