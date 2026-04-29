import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StationSelector from "./StationSelector";

const meta: Meta<typeof StationSelector> = {
  title: "Radio/StationSelector",
  component: StationSelector,
  argTypes: {
    onStationChange: { action: "stationChanged" },
  },
};

export default meta;
type Story = StoryObj<typeof StationSelector>;

export const NoSelection: Story = {
  args: {
    stations: ["All", "G", "A", "D"],
    currentStation: null,
    disabled: false,
  },
};

export const GSelected: Story = {
  args: {
    stations: ["All", "G", "A", "D"],
    currentStation: "G",
    disabled: false,
  },
};

export const AllSelected: Story = {
  args: {
    stations: ["All", "G", "A", "D"],
    currentStation: "All",
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    stations: ["All", "G", "A", "D"],
    currentStation: "G",
    disabled: true,
  },
};
