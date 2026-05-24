import Papa from 'papaparse';

/**
 * Export data ke CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Nama file export (tanpa .csv)
 * @param {Array} columns - Optional: custom column mapping [{key: 'customer_id', label: 'ID'}, ...]
 */
export const exportToCSV = (data, filename = 'export', columns = null) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Default columns untuk exported data
  const defaultColumns = [
    { key: 'customer_id', label: 'ID Pelanggan' },
    { key: 'company_name', label: 'Nama Perusahaan' },
    { key: 'plan_type', label: 'Tipe Plan' },
    { key: 'churn_score', label: 'Churn Score' },
    { key: 'risk_level', label: 'Level Risiko' },
    { key: 'mrr', label: 'MRR ($)' },
    { key: 'tenure_months', label: 'Durasi (Bulan)' },
    { key: 'total_tickets', label: 'Total Tiket' },
    { key: 'avg_nps_score', label: 'Skor NPS' },
    { key: 'avg_usage_hrs', label: 'Usage (Jam)' },
    { key: 'days_since_login', label: 'Hari Sejak Login' },
    { key: 'assigned_to', label: 'ID Staff Assigned' },
  ];

  const colsToUse = columns || defaultColumns;

  // Transform data sesuai column mapping
  const exportData = data.map(row => {
    const transformedRow = {};
    colsToUse.forEach(col => {
      transformedRow[col.label] = row[col.key] ?? '';
    });
    return transformedRow;
  });

  // Gunakan PapaParse untuk convert ke CSV string
  const csv = Papa.unparse(exportData);

  // Create blob dan download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // Set filename dengan timestamp
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const finalFilename = `${filename}_${timestamp}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
