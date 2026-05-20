export function localDateStr(d: Date = new Date()): string {
  return (
    d.getFullYear() +
    '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0')
  );
}

// Kullanıcının "günsonu" saatine göre aktif tarihi döndürür.
// dayEndHour=2 ise saat 01:30'da hâlâ bir önceki gün sayılır.
export function getAppDate(dayEndHour: number = 0): string {
  const now = new Date();
  if (dayEndHour > 0 && now.getHours() < dayEndHour) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return localDateStr(prev);
  }
  return localDateStr(now);
}
