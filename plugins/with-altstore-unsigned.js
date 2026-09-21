module.exports = function withAltStoreUnsigned(config) {
  if (process.env.CAMPUSFLOW_UNSIGNED_BUILD !== '1') {
    return config;
  }

  const iosBuild = config.extra?.eas?.build?.experimental?.ios;

  if (iosBuild) {
    delete iosBuild.appExtensions;
  }

  return config;
};
