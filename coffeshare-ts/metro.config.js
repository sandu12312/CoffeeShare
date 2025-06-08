const { getDefaultConfig } = require("expo/metro-config");
const { withSentryConfig } = require("@sentry/react-native/metro");

// Start with default Expo config
const config = getDefaultConfig(__dirname);

// Apply Sentry configuration
const sentryConfig = withSentryConfig(config);

// Add obfuscation transformer for production builds only
if (process.env.NODE_ENV === "production") {
  sentryConfig.transformer.babelTransformerPath = require.resolve(
    "react-native-obfuscating-transformer"
  );

  sentryConfig.transformer.obfuscatorOptions = {
    compact: true,
    controlFlowFlattening: true,
    debugProtection: true,
    debugProtectionInterval: 2000,
    disableConsoleOutput: true,
    identifierNamesGenerator: "hexadecimal",
    log: false,
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ["base64"],
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
  };
}

module.exports = sentryConfig;
