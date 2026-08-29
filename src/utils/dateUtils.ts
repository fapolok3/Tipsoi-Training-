/**
 * Formats any date input (ISO, YYYY-MM-DD, DD-Mon-YY, Excel serial number, JS Date, etc.)
 * into 'dd/mm/yyyy' format (e.g., 30/08/2026).
 */
export const formatTrainingDate = (dateVal?: string | number | Date | null): string => {
  if (!dateVal || dateVal === 'N/A' || String(dateVal).trim() === '') return 'N/A';

  const raw = String(dateVal).trim();

  // Handle Excel numeric dates (e.g., 45534)
  if (!isNaN(Number(raw)) && Number(raw) > 30000 && Number(raw) < 70000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + Number(raw) * 86400000);
    const day = String(jsDate.getUTCDate()).padStart(2, '0');
    const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const year = jsDate.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  // Handle YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, or DD-MM-YYYY
  const dmyMatch = raw.match(/^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})$/);
  if (dmyMatch) {
    if (dmyMatch[1].length === 4) {
      // YYYY-MM-DD format
      const year = dmyMatch[1];
      const month = dmyMatch[2].padStart(2, '0');
      const day = dmyMatch[3].padStart(2, '0');
      return `${day}/${month}/${year}`;
    } else {
      // DD-MM-YYYY or DD/MM/YYYY
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      let year = dmyMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${day}/${month}/${year}`;
    }
  }

  // Handle named month format like 10-jan-26, 10-Jan-2026, Jan 10 2026
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const monMatch = raw.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{2,4})$/);
  if (monMatch) {
    const day = monMatch[1].padStart(2, '0');
    const monthKey = monMatch[2].slice(0, 3).toLowerCase();
    const month = monthMap[monthKey] || '01';
    let year = monMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${day}/${month}/${year}`;
  }

  // Fallback JavaScript Date parsing
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return raw;
};
