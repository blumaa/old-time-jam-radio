import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LoadingSpinner from "./LoadingSpinner";

const meta: Meta<typeof LoadingSpinner> = {
  title: "Radio/LoadingSpinner",
  component: LoadingSpinner,
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {};
