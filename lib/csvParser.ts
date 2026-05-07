import { PatientRecord } from '@/types';

export function parseCSV(text: string): PatientRecord[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, i) => { row[header] = values[i] ?? ''; });

    return {
      patientId: row['Patient_ID'] ?? '',
      age: Number(row['Age']) || 0,
      gender: row['Gender'] ?? '',
      condition: row['Condition'] ?? '',
      procedure: row['Procedure'] ?? '',
      cost: Number(row['Cost']) || 0,
      lengthOfStay: Number(row['Length_of_Stay']) || 0,
      readmission: row['Readmission'] ?? '',
      outcome: row['Outcome'] ?? '',
      satisfaction: Number(row['Satisfaction']) || 0,
    };
  });
}