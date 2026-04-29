import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RadioDisplay from "./RadioDisplay";

const meta: Meta<typeof RadioDisplay> = {
  title: "Radio/RadioDisplay",
  component: RadioDisplay,
};

export default meta;
type Story = StoryObj<typeof RadioDisplay>;

export const Off: Story = {
  args: {
    tuneName: null,
    artist: null,
    stationKey: null,
    speed: 1.0,
    progress: 0,
    isPoweredOn: false,
  },
};

export const OnPlaying: Story = {
  args: {
    tuneName: "Turkey in the Straw",
    artist: "Dan Gellert",
    stationKey: "G",
    speed: 0.75,
    progress: 0.4,
    isPoweredOn: true,
  },
};

export const OnNoSignal: Story = {
  args: {
    tuneName: null,
    artist: null,
    stationKey: "D",
    speed: 1.0,
    progress: 0,
    isPoweredOn: true,
  },
};

export const OnSlowSpeed: Story = {
  args: {
    tuneName: "Salt Creek",
    artist: "Brad Leftwich",
    stationKey: "A",
    speed: 0.25,
    progress: 0.85,
    isPoweredOn: true,
  },
};

export const LongTitle: Story = {
  args: {
    tuneName: "Old Joe Clark Went to the Mountain to Fetch a Pail of Possum Fat",
    artist: "The Skillet Lickers & Riley Puckett with Clayton McMichen",
    stationKey: "G",
    speed: 0.75,
    progress: 0.6,
    isPoweredOn: true,
  },
};

export const Tuning: Story = {
  args: {
    tuneName: "Tuning...",
    artist: null,
    stationKey: "D",
    speed: 1.0,
    progress: 0,
    isPoweredOn: true,
  },
};
