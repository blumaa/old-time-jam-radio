import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TuneList from "./TuneList";
import type { Tune } from "@/app/radio/types";

const sampleTunes: Tune[] = [
  { title: "Sally Ann", artist: "Highwoods Stringband", key: "A", url: "sally.mp3", duration: 180, confidence: 0.95, format: "mp3" },
  { title: "Salt Creek", artist: "Brad Leftwich", key: "A", url: "salt.mp3", duration: 150, confidence: 0.42, format: "mp3" },
  { title: "Cluck Old Hen", artist: "Dan Gellert", key: "D", url: "cluck.mp3", duration: 200, confidence: 0.75, format: "mp3" },
  { title: "Turkey in the Straw", artist: "The Skillet Lickers", key: "G", url: "turkey.mp3", duration: 170, confidence: 0.88, format: "mp3" },
  { title: "Sandy Boys", artist: "Tommy Jarrell", key: "D", url: "sandy.mp3", duration: 160, confidence: 0.31, format: "mp3" },
];

const meta: Meta<typeof TuneList> = {
  title: "Admin/TuneList",
  component: TuneList,
  argTypes: {
    onEdit: { action: "edit" },
    onDelete: { action: "delete" },
    onSortByConfidence: { action: "sortByConfidence" },
  },
};

export default meta;
type Story = StoryObj<typeof TuneList>;

export const WithTunes: Story = {
  args: {
    tunes: sampleTunes,
    r2PublicUrl: "https://example.com",
    sortDirection: null,
  },
};

export const Empty: Story = {
  args: {
    tunes: [],
    r2PublicUrl: "https://example.com",
    sortDirection: null,
  },
};

export const SortedAscending: Story = {
  args: {
    tunes: [...sampleTunes].sort((a, b) => a.confidence - b.confidence),
    r2PublicUrl: "https://example.com",
    sortDirection: "asc",
  },
};

export const SortedDescending: Story = {
  args: {
    tunes: [...sampleTunes].sort((a, b) => b.confidence - a.confidence),
    r2PublicUrl: "https://example.com",
    sortDirection: "desc",
  },
};
