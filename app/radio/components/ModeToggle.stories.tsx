import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ModeToggle from "./ModeToggle";

const meta: Meta<typeof ModeToggle> = {
  title: "Radio/ModeToggle",
  component: ModeToggle,
  argTypes: {
    onModeChange: { action: "modeChanged" },
  },
  parameters: {
    docs: {
      description: {
        component: "Tiny vertical toggle switch. Slides between JAM and LEARN modes.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModeToggle>;

export const Jam: Story = {
  args: { mode: "jam", disabled: false },
};

export const Learn: Story = {
  args: { mode: "learn", disabled: false },
};

export const Disabled: Story = {
  args: { mode: "jam", disabled: true },
};
