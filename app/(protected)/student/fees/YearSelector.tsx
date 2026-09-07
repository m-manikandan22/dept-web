'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function YearSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = searchParams.get('year') || '2024-2025';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', e.target.value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-3">
      <label className="text-sm font-medium text-gray-700">Academic Year:</label>
      <select
        value={currentYear}
        onChange={handleChange}
        className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="2023-2024">2023-2024</option>
        <option value="2024-2025">2024-2025</option>
        <option value="2025-2026">2025-2026</option>
      </select>
    </div>
  );
}
