// Fallback App.tsx for EAS builds
// This imports and renders the Expo Router root component
import React from "react";
import RootLayout from "./app/_layout";

export default function App() {
  return <RootLayout />;
}
