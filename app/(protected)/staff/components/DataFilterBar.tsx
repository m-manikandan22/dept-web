'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Batch {
  id: string;
  name: string;
}

interface DataFilterBarProps {
  batches: Batch[];
  sections: string[];
  currentBatch?: string;
  currentSection?: string;
}

export default function DataFilterBar({
  batches,
  sections,
  currentBatch,
  currentSection,
}: DataFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Batch:</label>
        <select
          value={currentBatch || ''}
          onChange={(e) => updateFilter('batch', e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Batches</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Section:</label>
        <select
          value={currentSection || ''}
          onChange={(e) => updateFilter('section', e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sections</option>
          {sections.map((section) => (
            <option key={section} value={section}>
              Section {section}
            </option>
          ))}
        </select>
      </div>

      {currentBatch || currentSection ? (
        <button
          onClick={() => router.push('?') }
          className="text-xs text-blue-600 hover:underline"
        >
          Clear Filters
        </button>
      ) : null}
    </div>
  );
}
