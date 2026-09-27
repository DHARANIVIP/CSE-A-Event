"use client";

import React, { useEffect } from "react";

/**
 * InspectGuard: Restricts browser developer tools, right-click context menu,
 * page-source shortcuts, and element inspection to ensure student investigators
 * cannot inspect client assets.
 *
 * NOTE: All answer keys and Mystery Box access codes are cryptographically verified
 * on the server via scrypt hashing and never exist in client-side bundles or DOM.
 */
export const InspectGuard: React.FC = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Console security banner
    const bannerTitle =
      "color: #ff2a5f; font-size: 18px; font-weight: 900; background: #111; padding: 4px 10px; border-radius: 4px;";
    const bannerBody =
      "color: #e5e5e5; font-size: 13px; font-weight: 600; line-height: 1.6;";

    const showSecurityBanner = () => {
      try {
        console.clear();
        console.log("%c⛔ DETECTRIX FORENSIC STATION — ACCESS RESTRICTED", bannerTitle);
        console.log(
          "%cInspecting page source or reverse-engineering is monitored and restricted.\nAll checkpoints and mystery box codes are cryptographically verified server-side.\nNo answer keys exist in the client DOM.",
          bannerBody
        );
      } catch {}
    };

    showSecurityBanner();

    // 2. Disable context menu (Right-click Inspect)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showSecurityBanner();
      return false;
    };

    // 3. Block DevTools keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      const key = (e.key || "").toUpperCase();
      const keyCode = e.keyCode || e.which;

      // F12 (DevTools)
      if (key === "F12" || keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityBanner();
        return false;
      }

      // Ctrl+Shift+I / Cmd+Option+I (Inspect)
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      // Ctrl+Shift+K (Firefox console)
      if (
        (isCtrlOrCmd && isShift && (key === "I" || key === "J" || key === "C" || key === "K")) ||
        (isCtrlOrCmd && isAlt && (key === "I" || key === "J" || key === "C"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityBanner();
        return false;
      }

      // Ctrl+U / Cmd+U (View Page Source)
      if (isCtrlOrCmd && key === "U") {
        e.preventDefault();
        e.stopPropagation();
        showSecurityBanner();
        return false;
      }

      // Ctrl+S / Cmd+S (Save Page)
      if (isCtrlOrCmd && key === "S") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 4. Disable image/element dragging
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === "IMG") {
        e.preventDefault();
        return false;
      }
    };

    // 5. Periodic DevTools open check
    const devToolsCheckInterval = setInterval(() => {
      const threshold = 160;
      const isDocked =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;

      if (isDocked) {
        showSecurityBanner();
      }
    }, 2000);

    window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("dragstart", handleDragStart, { capture: true });

    return () => {
      clearInterval(devToolsCheckInterval);
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("dragstart", handleDragStart, { capture: true });
    };
  }, []);

  return null;
};
