"use client";

import React from "react";
import { LaunchDemoProvider } from "@/components/launch-demo/LaunchDemoContext";
import { LaunchDemoContainer } from "@/components/launch-demo/LaunchDemoContainer";

export default function ExperimentPage() {
  return (
    <LaunchDemoProvider>
      <LaunchDemoContainer />
    </LaunchDemoProvider>
  );
}
