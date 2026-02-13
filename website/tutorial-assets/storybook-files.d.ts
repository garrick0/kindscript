// Type declaration for storybook-files.json
declare module '*/tutorial-assets/storybook-files.json' {
  interface StorybookFile {
    path: string;
    contents: string;
  }
  const value: StorybookFile[];
  export default value;
}
