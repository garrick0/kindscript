import type { Meta, StoryObj } from "@storybook/react";
import { DashboardPageSimple } from "./DashboardPageSimple";

const meta = {
  title: "Pages/Dashboard/SimpleDashboard",
  component: DashboardPageSimple,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof DashboardPageSimple>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userId: "user-123",
  },
};

export const WithoutUserId: Story = {
  args: {},
};
