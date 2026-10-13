export type MasteryStatus = 'mastered' | 'unfamiliar' | 'none';

const STORAGE_KEY = 'xr-typing-mastery-v1';

function loadMap(): Record<string, MasteryStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, MasteryStatus>;
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, MasteryStatus>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getMastery(courseId: string): MasteryStatus {
  const map = loadMap();
  return map[courseId] || 'none';
}

export function setMastery(courseId: string, status: MasteryStatus): void {
  const map = loadMap();
  if (status === 'none') {
    delete map[courseId];
  } else {
    map[courseId] = status;
  }
  saveMap(map);
}

export function countMastery(courseIds: string[]): { mastered: number; unfamiliar: number } {
  const map = loadMap();
  let mastered = 0;
  let unfamiliar = 0;
  for (const id of courseIds) {
    if (map[id] === 'mastered') mastered += 1;
    if (map[id] === 'unfamiliar') unfamiliar += 1;
  }
  return { mastered, unfamiliar };
}
