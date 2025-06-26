import React from "react";

if (__DEV__) {
  // Încarc doar în dezvoltare
  const whyDidYouRender = require("@welldone-software/why-did-you-render");

  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    logOnDifferentValues: true,
    collapseGroups: true,
    include: [
      // Adaug componentele specifice pe care vreau să le urmăresc
      /^(Map|Cart|Dashboard|QR|Product)/,
    ],
    exclude: [
      // Exclud componentele care se schimbă frecvent prin design
      /^(Animated|Toast|Modal)/,
    ],
  });

  console.log("🔍 Why Did You Render enabled for performance monitoring");
}
