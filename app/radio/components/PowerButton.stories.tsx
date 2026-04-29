import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PowerButton from "./PowerButton";

const meta: Meta<typeof PowerButton> = {
  title: "Radio/PowerButton",
  component: PowerButton,
  argTypes: {
    onClick: { action: "clicked" },
  },
  parameters: {
    docs: {
      description: {
        component: "Vintage Bakelite toggle switch. Rocker lever shifts between I (on) and O (off) positions.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PowerButton>;

export const Off: Story = {
  args: { isPoweredOn: false },
};

export const On: Story = {
  args: { isPoweredOn: true },
};
