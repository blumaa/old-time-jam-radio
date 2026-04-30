import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StaticWaveform from "./StaticWaveform";

const meta: Meta<typeof StaticWaveform> = {
  title: "Radio/StaticWaveform",
  component: StaticWaveform,
  decorators: [
    (Story) => (
      <div style={{ width: 300, height: 24, background: "#c49520", borderRadius: 4, position: "relative", overflow: "hidden" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StaticWaveform>;

export const Default: Story = {
  args: {},
};

export const InRadioDisplay: Story = {
  args: {
    className: "radio-display__static-waveform",
  },
};
