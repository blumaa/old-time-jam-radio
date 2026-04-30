import type { Preview } from "@storybook/nextjs-vite";
import type { Decorator } from "@storybook/react";
import React, { useEffect } from "react";
import "../styles/global.css";
import "../styles/radio.css";
import "../styles/admin.css";
import "../styles/themes.css";
import "../styles/loading-spinner.css";

function ThemeProvider({ theme, children }: { theme: string; children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "walnut") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
    root.style.setProperty("background", "var(--color-bg)");
    return () => {
      root.removeAttribute("data-theme");
      root.style.removeProperty("background");
    };
  }, [theme]);

  return <>{children}</>;
}

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? "walnut";
  return (
    <ThemeProvider theme={theme}>
      <Story />
    </ThemeProvider>
  );
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "walnut", title: "Warm Walnut", right: "default" },
          { value: "midnight", title: "Midnight Mahogany" },
          { value: "blonde", title: "Blonde Maple" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
};

export default preview;
