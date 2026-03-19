export type DifficultyFilter = 'All' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type TrailLengthFilter = 'All' | '<10' | '10-25' | '25-50' | '50+';

export function parseMiles(milesStr: string): number {
  const match = milesStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

export function matchesLengthRange(miles: number, filter: TrailLengthFilter): boolean {
  switch (filter) {
    case 'All': return true;
    case '<10': return miles < 10;
    case '10-25': return miles >= 10 && miles <= 25;
    case '25-50': return miles > 25 && miles <= 50;
    case '50+': return miles > 50;
  }
}

export const TRAIL_LENGTH_LABELS: Record<TrailLengthFilter, string> = {
  'All': 'All',
  '<10': '< 10 mi',
  '10-25': '10–25 mi',
  '25-50': '25–50 mi',
  '50+': '50+ mi',
};

export const DIFFICULTY_OPTIONS: DifficultyFilter[] = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const TRAIL_LENGTH_OPTIONS: TrailLengthFilter[] = ['All', '<10', '10-25', '25-50', '50+'];
