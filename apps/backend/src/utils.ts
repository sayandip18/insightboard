// TODO: remove any types and replace with proper interfaces
export function sanitizeDependencies(tasks: any[]) {
  const validIds = new Set(tasks.map((t) => t.id));

  return tasks.map((task) => ({
    ...task,
    dependencies: task.dependencies.filter(
      (dep: string) => validIds.has(dep) && dep !== task.id,
    ),
  }));
}

export function resolveCycles(tasks: any[]) {
  const graph = new Map<string, string[]>();
  for (const task of tasks) {
    graph.set(task.id, task.dependencies);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cyclic = new Set<string>();
  const path: string[] = [];

  function dfs(id: string) {
    visited.add(id);
    inStack.add(id);
    path.push(id);

    for (const dep of graph.get(id) ?? []) {
      if (!visited.has(dep)) {
        dfs(dep);
      } else if (inStack.has(dep)) {
        const cycleStart = path.indexOf(dep);
        for (let i = cycleStart; i < path.length; i++) {
          cyclic.add(path[i]);
        }
      }
    }

    path.pop();
    inStack.delete(id);
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) dfs(task.id);
  }

  return tasks.map((task) =>
    cyclic.has(task.id) ? { ...task, status: "blocked" } : task,
  );
}

export function validateTasks(tasks: any[]) {
  return tasks.filter(
    (task) =>
      typeof task.id === "string" &&
      typeof task.description === "string" &&
      typeof task.priority === "string" &&
      Array.isArray(task.dependencies),
  );
}
