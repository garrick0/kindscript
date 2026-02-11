import { Lesson } from './types';

export const lesson: Lesson = {
slug: "6-1-full-design-system",
title: "Your Lesson Title",
partTitle: "Part 6 Title (or existing part if adding to part 5)",
partNumber: 6, // or 5 if adding to existing "Modeling Molecules" part
lessonNumber: 1,
focus: "src/context.ts", // Default file to open
files: [
    {
    path: "src/context.ts",
    contents: "// Your starting code here"
    },
    // Add more starting files
],
solution: [
    {
    path: "src/context.ts",
    contents: "// Your solution code here"
    },
    // Add solution files
]
};

