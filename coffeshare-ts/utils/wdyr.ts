import React from "react";

if (__DEV__) {
  // Only load in development
  const whyDidYouRender = require("@welldone-software/why-did-you-render");

  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    logOnDifferentValues: true,
    collapseGroups: true,
    include: [
      // Add specific components you want to track
      /^(Map|Cart|Dashboard|QR|Product)/,
    ],
    exclude: [
      // Exclude components that change frequently by design
      /^(Animated|Toast|Modal)/,
    ],
  });

  console.log("🔍 Why Did You Render enabled for performance monitoring");
}
