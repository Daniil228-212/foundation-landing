"use client";

import { Component, type ReactNode } from "react";
import { useFoundation } from "@/store/foundation";

/**
 * Страховка для WebGL: если сцена упала (старый браузер, драйвер, шейдер),
 * остальной сайт продолжает работать, а вместо 3D показывается фолбэк.
 */
export class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("3D-сцена отключена:", error);
    // без сцены заставка не доиграет — сразу открываем интерфейс
    const { phase, skipIntro } = useFoundation.getState();
    if (phase === "intro" || phase === "greeting") skipIntro();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
