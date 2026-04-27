import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName, sheetName = 'Data') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Buffer to binary string
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
