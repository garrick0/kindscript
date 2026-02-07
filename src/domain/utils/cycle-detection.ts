/**
 * Find all cycles in a directed graph using DFS.
 *
 * @param edges - Adjacency list: node name → set of neighbor names
 * @returns Array of cycles, each cycle is an array of node names
 */
export function findCycles(edges: Map<string, Set<string>>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  const dfs = (node: string, path: string[]): void => {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart));
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    for (const neighbor of edges.get(node) || []) {
      dfs(neighbor, path);
    }

    path.pop();
    inStack.delete(node);
  };

  for (const node of edges.keys()) {
    dfs(node, []);
  }

  return cycles;
}
