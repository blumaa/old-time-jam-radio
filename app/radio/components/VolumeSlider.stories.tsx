import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import VolumeSlider from "./VolumeSlider";

const meta: Meta<typeof VolumeSlider> = {
  title: "Radio/VolumeSlider",
  component: VolumeSlider,
  argTypes: {
    onVolumeChange: { action: "volumeChanged" },
  },
};

export default meta;
type Story = StoryObj<typeof VolumeSlider>;

export const Default: Story = {
  args: { volume: 0.7, disabled: false },
};

export const Muted: Story = {
  args: { volume: 0, disabled: false },
};

export const FullVolume: Story = {
  args: { volume: 1, disabled: false },
};

export const Disabled: Story = {
  args: { volume: 0.5, disabled: true },
};
