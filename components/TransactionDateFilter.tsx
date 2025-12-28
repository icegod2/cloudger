'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DateRangePicker } from '@/components/DateRangePicker';

export function TransactionDateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date') || '';

    const handleDateChange = (date: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (date) params.set('date', date);
        else params.delete('date');
        router.push(`/transactions?${params.toString()}`);
    };

    return (
        <div className="w-[240px]">
            <DateRangePicker value={dateParam} onChange={handleDateChange} />
        </div>
    );
}
