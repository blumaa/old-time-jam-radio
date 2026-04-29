import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SpeedSlider from "./SpeedSlider";

const meta: Meta<typeof SpeedSlider> = {
  title: "Radio/SpeedSlider",
  component: SpeedSlider,
  argTypes: {
    onSpeedChange: { action: "speedChanged" },
  },
};

export default meta;
type Story = StoryObj<typeof SpeedSlider>;

export const Default: Story = {
  args: { speed: 1, disabled: false },
};

export const SlowSpeed: Story = {
  args: { speed: 0.25, disabled: false },
};

export const MidSpeed: Story = {
  args: { speed: 0.5, disabled: false },
};

export const Disabled: Story = {
  args: { speed: 0.75, disabled: true },
};
