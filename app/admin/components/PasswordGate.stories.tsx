import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PasswordGate from "./PasswordGate";

const meta: Meta<typeof PasswordGate> = {
  title: "Admin/PasswordGate",
  component: PasswordGate,
  argTypes: {
    onSuccess: { action: "success" },
  },
};

export default meta;
type Story = StoryObj<typeof PasswordGate>;

export const Default: Story = {
  args: {},
};
