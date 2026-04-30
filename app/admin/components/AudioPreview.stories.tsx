import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import AudioPreview from "./AudioPreview";

const meta: Meta<typeof AudioPreview> = {
  title: "Admin/AudioPreview",
  component: AudioPreview,
};

export default meta;
type Story = StoryObj<typeof AudioPreview>;

export const Default: Story = {
  args: {
    url: "https://example.com/sample.mp3",
  },
};
