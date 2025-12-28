'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DateRangePicker({ value, onChange }: { value: string, onChange: (date: string) => void }) {
    const [view, setView] = React.useState<'month' | 'year' | 'all'>(() => {
        if (value === 'all') return 'all';
        if (value && value.length === 4) return 'year';
        return 'month';
    });
    
    const [year, setYear] = React.useState(() => {
        if (!value || value === 'all') return new Date().getFullYear();
        return parseInt(value.split('-')[0]);
    });
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        if (value && value !== 'all') {
            setYear(parseInt(value.split('-')[0]));
            if (value.length === 4) setView('year');
            else setView('month');
        } else if (value === 'all') {
            setView('all');
        }
    }, [value]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const handleMonthSelect = (index: number) => {
        const monthStr = String(index + 1).padStart(2, '0');
        onChange(`${year}-${monthStr}`);
        setIsOpen(false);
    };

    const handleYearSelect = (y: number) => {
        onChange(String(y));
        setIsOpen(false);
    };

    const handleAllSelect = () => {
        onChange('all');
        setIsOpen(false);
    };

    const getFormattedDate = () => {
        if (value === 'all') return "All Time";
        if (value && value.length === 4) return `Year ${value}`;
        if (!value) return "Select Date";
        
        const displayDate = new Date(value + "-01");
        return !isNaN(displayDate.getTime()) 
            ? displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) 
            : value;
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        "text-zinc-900 dark:text-zinc-100"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {getFormattedDate()}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800" align="start">
                {/* Mode Selector */}
                <div className="flex p-1 border-b border-zinc-100 dark:border-zinc-800">
                    {['month', 'year', 'all'].map((m) => (
                        <Button
                            key={m}
                            variant="ghost"
                            size="sm"
                            onClick={() => setView(m as any)}
                            className={cn(
                                "flex-1 text-[10px] uppercase tracking-wider font-bold h-7",
                                view === m && "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                            )}
                        >
                            {m}
                        </Button>
                    ))}
                </div>

                {view === 'month' && (
                    <>
                        <div className="flex items-center justify-between p-2 border-b border-zinc-100 dark:border-zinc-800">
                            <Button variant="ghost" size="icon" onClick={() => setYear(year - 1)} className="h-7 w-7">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="font-semibold text-sm">{year}</div>
                            <Button variant="ghost" size="icon" onClick={() => setYear(year + 1)} className="h-7 w-7">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 p-2">
                            {months.map((month, index) => {
                                 const currentMonthStr = `${year}-${String(index + 1).padStart(2, '0')}`;
                                 const isSelected = value === currentMonthStr;
                                 return (
                                    <Button
                                        key={month}
                                        variant={isSelected ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => handleMonthSelect(index)}
                                        className={cn("text-xs h-8", isSelected && "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900")}
                                    >
                                        {month}
                                    </Button>
                                 );
                            })}
                        </div>
                    </>
                )}

                {view === 'year' && (
                    <div className="grid grid-cols-2 gap-2 p-2">
                        {[year - 2, year - 1, year, year + 1, year + 2].map((y) => (
                            <Button
                                key={y}
                                variant={value === String(y) ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleYearSelect(y)}
                                className={cn("text-xs h-8", value === String(y) && "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900")}
                            >
                                {y}
                            </Button>
                        ))}
                    </div>
                )}

                {view === 'all' && (
                    <div className="p-4">
                        <Button 
                            className="w-full bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900" 
                            onClick={handleAllSelect}
                        >
                            Select All Time
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
