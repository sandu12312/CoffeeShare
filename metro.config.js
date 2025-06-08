const { getDefaultConfig } = require("expo/metro-config");
const { withSentryConfig } = require("@sentry/react-native/metro");
const path = require("path");

// Set the project root to the coffeshare-ts subdirectory
const projectRoot = path.resolve(__dirname, "coffeshare-ts");

// Start with default Expo config using the subdirectory as project root
const config = getDefaultConfig(projectRoot, {
  // Include the parent directory in the watchFolders
  watchFolders: [__dirname],
});

// Update resolver to include both directories
config.resolver.platforms = ["ios", "android", "native", "web"];
config.resolver.alias = {
  ...config.resolver.alias,
  // Add any necessary aliases here
};

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
