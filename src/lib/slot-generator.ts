export interface SlotDefinition {
  startTime: string; // "08:00"
  endTime: string;   // "08:15"
}

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generator slot jadwal pengambilan rapor Sekolah Islam Mumtaz
 * Memastikan tidak ada slot yang bertabrakan dengan waktu istirahat (default: 11:45 - 13:00)
 */
export function generateTimeSlots(options: {
  startTime?: string;      // default: "08:00"
  breakStart?: string;     // default: "11:45"
  breakEnd?: string;       // default: "13:00"
  durationMinutes: number; // 10, 15, or 20
  studentCount: number;    // N slots to generate
}): SlotDefinition[] {
  const {
    startTime = '08:00',
    breakStart = '11:45',
    breakEnd = '13:00',
    durationMinutes,
    studentCount,
  } = options;

  if (studentCount <= 0) return [];

  const breakStartMin = parseTimeToMinutes(breakStart);
  const breakEndMin = parseTimeToMinutes(breakEnd);
  let currentMin = parseTimeToMinutes(startTime);

  const slots: SlotDefinition[] = [];

  while (slots.length < studentCount) {
    const slotStartMin = currentMin;
    const slotEndMin = currentMin + durationMinutes;

    // Cek apakah slot ini bertabrakan dengan rentang istirahat:
    // Tabrakan terjadi jika slot berakhir setelah jam mulai istirahat DAN slot dimulai sebelum jam selesai istirahat.
    if (slotEndMin > breakStartMin && slotStartMin < breakEndMin) {
      // Langsung lompat ke jam selesai istirahat
      currentMin = breakEndMin;
      continue;
    }

    slots.push({
      startTime: minutesToTimeString(slotStartMin),
      endTime: minutesToTimeString(slotEndMin),
    });

    currentMin = slotEndMin;
  }

  return slots;
}
