import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TuneSearch from "./TuneSearch";
import type { Tune } from "../types";

const sampleResults: Tune[] = [
  { title: "Sally Ann", artist: "Highwoods Stringband", key: "A", url: "sally.mp3", duration: 180, confidence: 1.0, format: "mp3" },
  { title: "Salt Creek", artist: "Brad Leftwich", key: "A", url: "salt.mp3", duration: 150, confidence: 0.9, format: "mp3" },
  { title: "Cluck Old Hen", artist: "Dan Gellert", key: "D", url: "cluck.mp3", duration: 200, confidence: 0.95, format: "mp3" },
  { title: "Turkey in the Straw", artist: "The Skillet Lickers", key: "G", url: "turkey.mp3", duration: 170, confidence: 0.88, format: "mp3" },
  { title: "Sandy Boys", artist: "Tommy Jarrell", key: "D", url: "sandy.mp3", duration: 160, confidence: 0.92, format: "mp3" },
];

const meta: Meta<typeof TuneSearch> = {
  title: "Radio/TuneSearch",
  component: TuneSearch,
  argTypes: {
    onQueryChange: { action: "queryChanged" },
    onSelectTune: { action: "tuneSelected" },
    onClose: { action: "closed" },
  },
  parameters: {
    docs: {
      description: {
        component: "Search input with scrollable result list. Used inside the bottom drawer.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TuneSearch>;

export const Open: Story = {
  args: { isOpen: true, query: "", results: sampleResults },
};

export const WithQuery: Story = {
  args: { isOpen: true, query: "sal", results: sampleResults.slice(0, 2) },
};

export const NoResults: Story = {
  args: { isOpen: true, query: "zzz", results: [] },
};

export const Closed: Story = {
  args: { isOpen: false, query: "", results: [] },
};
