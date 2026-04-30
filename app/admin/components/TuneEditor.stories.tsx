import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TuneEditor from "./TuneEditor";

const meta: Meta<typeof TuneEditor> = {
  title: "Admin/TuneEditor",
  component: TuneEditor,
  argTypes: {
    onSave: { action: "save" },
    onCancel: { action: "cancel" },
  },
};

export default meta;
type Story = StoryObj<typeof TuneEditor>;

export const Default: Story = {
  args: {
    tune: {
      title: "Sally Ann",
      artist: "Highwoods Stringband",
      key: "A",
      url: "sally.mp3",
      duration: 180,
      confidence: 0.95,
      format: "mp3",
    },
  },
};

export const LowConfidence: Story = {
  args: {
    tune: {
      title: "Unknown Tune",
      artist: "Traditional",
      key: "?",
      url: "unknown.mp3",
      duration: 120,
      confidence: 0.25,
      format: "mp3",
    },
  },
};
