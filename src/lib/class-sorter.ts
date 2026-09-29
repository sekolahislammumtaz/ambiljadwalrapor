/**
 * Utility untuk mengurutkan kelas secara alami (natural grade order).
 * Kelas paling kecil (7 / VII) berada di awal (paling kiri),
 * dan kelas paling besar (12 / XII) berada di akhir (paling kanan).
 */

function extractGradeRank(name: string): { grade: number; remainder: string } {
  if (!name) return { grade: 999, remainder: '' };
  const clean = name.trim();

  // 1. Cek angka Romawi (XII, XI, X, IX, VIII, VII, VI, V, IV, III, II, I)
  // Cocokkan di awal kata atau setelah 'Kelas '
  const romanMatch = clean.match(/(?:^|Kelas\s+)(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)(?:\s+|$|\b)/i);
  if (romanMatch) {
    const roman = romanMatch[1].toUpperCase();
    const romanMap: Record<string, number> = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
      VIII: 8,
      IX: 9,
      X: 10,
      XI: 11,
      XII: 12,
    };
    if (romanMap[roman] !== undefined) {
      return { grade: romanMap[roman], remainder: clean };
    }
  }

  // 2. Cek angka Arab seperti "Kelas 7", "Kelas 10", "7A", "10-1"
  const numMatch = clean.match(/(?:^|Kelas\s*)(\d+)/i);
  if (numMatch) {
    return { grade: parseInt(numMatch[1], 10), remainder: clean };
  }

  return { grade: 999, remainder: clean };
}

export function sortClassesNaturally<T extends { name: string }>(classes: T[]): T[] {
  return [...classes].sort((a, b) => {
    const rankA = extractGradeRank(a.name);
    const rankB = extractGradeRank(b.name);
    if (rankA.grade !== rankB.grade) {
      return rankA.grade - rankB.grade;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}
