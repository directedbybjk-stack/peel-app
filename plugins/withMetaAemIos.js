const { createRunOncePlugin, withAppDelegate, withInfoPlist } = require('@expo/config-plugins');

const FB_QUERY_SCHEMES = ['fbapi', 'fb-messenger-api', 'fbauth2', 'fbshareextension'];

function ensureLine(source, line, anchor) {
  if (source.includes(line)) {
    return source;
  }

  return source.replace(anchor, `${anchor}${line}\n`);
}

function withMetaAemIos(config, props = {}) {
  const { appID, clientToken, displayName = 'Peel' } = props;

  if (!appID || !clientToken) {
    return config;
  }

  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;
    const existingUrlTypes = infoPlist.CFBundleURLTypes ?? [];
    const facebookScheme = `fb${appID}`;

    const hasFacebookScheme = existingUrlTypes.some((entry) =>
      Array.isArray(entry.CFBundleURLSchemes) && entry.CFBundleURLSchemes.includes(facebookScheme)
    );

    if (!hasFacebookScheme) {
      if (existingUrlTypes[0]?.CFBundleURLSchemes) {
        existingUrlTypes[0].CFBundleURLSchemes.push(facebookScheme);
      } else {
        existingUrlTypes.push({
          CFBundleURLSchemes: [facebookScheme],
        });
      }
    }

    const existingQuerySchemes = new Set(infoPlist.LSApplicationQueriesSchemes ?? []);
    FB_QUERY_SCHEMES.forEach((scheme) => existingQuerySchemes.add(scheme));

    infoPlist.CFBundleURLTypes = existingUrlTypes;
    infoPlist.FacebookAppID = appID;
    infoPlist.FacebookClientToken = clientToken;
    infoPlist.FacebookDisplayName = displayName;
    infoPlist.FacebookAutoInitEnabled = false;
    infoPlist.FacebookAutoLogAppEventsEnabled = false;
    infoPlist.FacebookAdvertiserIDCollectionEnabled = false;
    infoPlist.LSApplicationQueriesSchemes = Array.from(existingQuerySchemes);

    return config;
  });

  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error('withMetaAemIos only supports Swift AppDelegate files.');
    }

    let src = config.modResults.contents;

    src = ensureLine(src, 'import FBAEMKit', 'internal import Expo\n');
    src = ensureLine(src, 'import FBSDKCoreKit', 'import FBAEMKit\n');

    const helperBlock = `
  private var facebookAppID: String? {
    Bundle.main.object(forInfoDictionaryKey: "FacebookAppID") as? String
  }
`;

    if (!src.includes('private var facebookAppID: String?')) {
      src = src.replace(
        '  var reactNativeFactory: RCTReactNativeFactory?\n',
        `  var reactNativeFactory: RCTReactNativeFactory?\n${helperBlock}`
      );
    }

    const openUrlNeedle = `  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }`;

    const openUrlReplacement = `  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    if let facebookAppID, !facebookAppID.isEmpty {
      AEMReporter.configure(networker: nil, appID: facebookAppID, reporter: nil)
      AEMReporter.enable()
      AEMReporter.handle(url)
    }

    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }`;

    if (src.includes(openUrlNeedle)) {
      src = src.replace(openUrlNeedle, openUrlReplacement);
    }

    config.modResults.contents = src;
    return config;
  });

  return config;
}

module.exports = createRunOncePlugin(withMetaAemIos, 'with-meta-aem-ios', '1.0.0');
