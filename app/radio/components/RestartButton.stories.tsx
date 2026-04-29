import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RestartButton from "./RestartButton";

const meta: Meta<typeof RestartButton> = {
  title: "Radio/RestartButton",
  component: RestartButton,
  argTypes: {
    onClick: { action: "clicked" },
  },
  parameters: {
    docs: {
      description: {
        component: "Small bakelite transport knob with restart icon. Replays current tune from the beginning.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RestartButton>;

export const Default: Story = {
  args: { disabled: false },
};

export const Disabled: Story = {
  args: { disabled: true },
};
