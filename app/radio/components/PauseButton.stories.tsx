import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PauseButton from "./PauseButton";

const meta: Meta<typeof PauseButton> = {
  title: "Radio/PauseButton",
  component: PauseButton,
  argTypes: {
    onClick: { action: "clicked" },
  },
  parameters: {
    docs: {
      description: {
        component: "Small bakelite transport knob. Shows pause icon when playing, play icon when paused.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PauseButton>;

export const Playing: Story = {
  args: { isPaused: false, disabled: false },
};

export const Paused: Story = {
  args: { isPaused: true, disabled: false },
};

export const Disabled: Story = {
  args: { isPaused: false, disabled: true },
};
