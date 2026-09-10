'use client';

import React from 'react';
import * as XLSX from 'xlsx';

interface ExportExcelButtonProps {
  data: Record<string, any>[];
  filename: string;
  sheetName?: string;
}

export default function ExportExcelButton({
  data,
  filename,
  sheetName = 'Sheet1',
}: ExportExcelButtonProps) {
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  if (!data || data.length === 0) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
      >
        No Data to Export
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
    >
      Download Excel
    </button>
  );
}
