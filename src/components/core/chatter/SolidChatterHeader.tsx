"use client"
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { useEffect, useState } from 'react'
import styles from './chatter.module.css'
import { SolidMessageComposer } from './SolidMessageComposer'

interface FilterState {
    name: string;
    startDate: Date | null;
    endDate: Date | null;
}

interface Props {
    activeTab: any,
    handleTabClick: any,
    visibleBox: any,
    solidFormViewMetaData: any,
    refetch: any,
    id: any,
    onFilterChange?: (filters: FilterState) => void;
}

export const SolidChatterHeader = (props: Props) => {
    const { activeTab, visibleBox, handleTabClick, solidFormViewMetaData, refetch, id, onFilterChange } = props;
    const [showFilterDialog, setShowFilterDialog] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        name: '',
        startDate: null,
        endDate: null
    });
    const [hasActiveFilters, setHasActiveFilters] = useState(false);

    useEffect(() => {
        const isActive = filters.name !== '' || filters.startDate !== null || filters.endDate !== null;
        setHasActiveFilters(isActive);
    }, [filters]);

    const handleFilterClick = () => {
        setShowFilterDialog(true);
    };

    const handleApplyFilters = () => {
        if (onFilterChange) {
            onFilterChange(filters);
        }
        setShowFilterDialog(false);
    };

    const handleClearFilters = () => {
        const clearedFilters = {
            name: '',
            startDate: null,
            endDate: null
        };
        setFilters(clearedFilters);
        if (onFilterChange) {
            onFilterChange(clearedFilters);
        }
        setShowFilterDialog(false);
    };

    return (
        <div className={styles.chatterTitle}>
            <div className='flex justify-content-between align-items-center'>
                <div className="form-wrapper-title">
                    Activity
                </div>
                <div className='flex align-items-center gap-2'>
                    <Button
                        label="Send Message"
                        size="small"
                        type="button"
                        onClick={() => handleTabClick('email-message')}
                        {...(activeTab !== 'email-message' && {
                            severity: 'secondary',
                            outlined: true,
                        })}
                    />
                    <Button
                        label="Log Note"
                        size="small"
                        type="button"
                        onClick={() => handleTabClick('log')}
                        {...(activeTab !== 'log' && {
                            severity: 'secondary',
                            outlined: true,
                        }
                        )}
                    />
                    <Button
                        icon="pi pi-filter-fill"
                        text
                        size='small'
                        severity="secondary"
                        aria-label="Filter"
                        style={{ 
                            width: 20,
                            color: hasActiveFilters ? '#722ED1' : undefined
                        }}
                        onClick={handleFilterClick}
                    />
                </div>
            </div>
            {visibleBox &&
                <div className='mt-4'>
                    {visibleBox === "email-message" &&
                        <SolidMessageComposer id={id} refetch={refetch} solidFormViewMetaData={solidFormViewMetaData} type={"email"} />
                    }

                    {visibleBox === "log" &&
                        <SolidMessageComposer id={id} refetch={refetch} solidFormViewMetaData={solidFormViewMetaData} />
                    }
                </div>
            }
            <Dialog 
                header="Filter Messages" 
                visible={showFilterDialog} 
                style={{ width: 500 }} 
                onHide={() => setShowFilterDialog(false)}
            >
                <div className="p-fluid">
                    <div className="flex flex-column gap-2">
                        <label htmlFor="name">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Filter By User"
                            className="p-inputtext p-inputtext-sm p-component"
                            value={filters.name}
                            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-column gap-2 mt-3">
                        <label htmlFor="dateRange">Date Range</label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Calendar
                                    id="startDate"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.value as Date }))}
                                    placeholder="Start Date"
                                    showIcon
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                />
                            </div>
                            <div className="flex-1">
                                <Calendar
                                    id="endDate"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.value as Date }))}
                                    placeholder="End Date"
                                    showIcon
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-content-end gap-2 mt-4">
                        <Button 
                            label="Clear" 
                            severity="secondary" 
                            outlined 
                            onClick={handleClearFilters}
                        />
                        <Button 
                            label="Apply" 
                            onClick={handleApplyFilters}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    )
}