import { useEffect, useState } from 'react'
import styles from './chatter.module.css'
import { SolidMessageComposer } from './SolidMessageComposer'
import { useLazyGetusersQuery } from '../../../redux/api/userApi'
import { ERROR_MESSAGES } from '../../../constants/error-messages'
import {
    SolidButton,
    SolidDialog,
    SolidDialogBody,
    SolidDialogClose,
    SolidDialogFooter,
    SolidDialogHeader,
    SolidDialogSeparator,
    SolidDialogTitle,
    SolidAutocomplete,
    SolidDatePicker
} from '../../shad-cn-ui'
import { Filter, RefreshCw,Edit } from 'lucide-react'
interface FilterState {
    name: string;
    startDate: Date | null;
    endDate: Date | null;
}

interface Props {
    activeTab: any,
    handleTabClick: any,
    visibleBox: any,
    modelSingularName: any,
    refetch: any,
    id: any,
    onFilterChange?: (filters: FilterState) => void;
    onComposerCancel?: () => void;
    title?: string;
    modelUserKey?: string;
}

export const SolidChatterHeader = (props: Props) => {
    const { activeTab, visibleBox, handleTabClick, modelSingularName, refetch, id, onFilterChange, onComposerCancel, title, modelUserKey } = props;
    const [showFilterDialog, setShowFilterDialog] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        name: '',
        startDate: null,
        endDate: null
    });
    const [hasActiveFilters, setHasActiveFilters] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [getUsers] = useLazyGetusersQuery();

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

    const updateNameFilter = (value: string) => {
        setFilters(prev => {
            if (prev.name === value) {
                return prev;
            }
            return {
                ...prev,
                name: value
            };
        });
    };

    const searchUsers = async (event: { query: string }) => {
        updateNameFilter(event.query || '');
        try {
            const response = await getUsers(`filters[fullName][$containsi]=${event.query}`).unwrap();
            setSuggestions(response?.data?.records || []);
        } catch (error) {
            console.error(ERROR_MESSAGES.FETCHING_USER, error);
            setSuggestions([]);
        }
    };

    const handleUserChange = (value: any) => {
        if (!value) {
            updateNameFilter('');
            return;
        }
        if (typeof value === 'object') {
            updateNameFilter(value.fullName || '');
            return;
        }
        updateNameFilter(value);
    };

    return (
        <div className={`${styles.chatterTitle} ${title ? styles.chatterTitleWithLabel : ''} solid-list-toolbar`}>
            <div className='flex justify-content-between align-items-center solid-list-toolbar-row'>
                <p className="m-0 view-title solid-text-wrapper form-wrapper-title">
                    {title || ''}
                </p>
                <div className='flex align-items-center solid-header-buttons-wrapper'>
                    {/* <Button
                        label="Send Message"
                        size="small"
                        type="button"
                        onClick={() => handleTabClick('email-message')}
                        {...(activeTab !== 'email-message' && {
                            severity: 'secondary',
                            outlined: true,
                        })}
                    /> */}
                    {/* <SolidButton
                        label="Log Note"
                        size="sm"
                        type="button"
                        variant="primary"
                        className="solid-purple-button"
                        onClick={() => handleTabClick('log')}
                    /> */}
                    <SolidButton
                        size="sm"
                        type="button"
                        aria-label="Log Note"
                        variant={hasActiveFilters ? 'primary' : 'outline'}
                        className="solid-icon-button"
                        style={{ gap: 0 }}
                        leftIcon={<Edit size={14} />}
                        onClick={() => handleTabClick('log')}
                    />
                    <SolidButton
                        size="sm"
                        type="button"
                        aria-label="Filter"
                        variant={hasActiveFilters ? 'primary' : 'outline'}
                        className="solid-icon-button"
                        style={{ gap: 0 }}
                        leftIcon={<Filter size={14} />}
                        onClick={handleFilterClick}
                    />
                    <SolidButton
                        size="sm"
                        type="button"
                        aria-label="Refresh"
                        variant="outline"
                        className="solid-icon-button"
                        style={{ gap: 0 }}
                        leftIcon={<RefreshCw size={14} />}
                        onClick={refetch}
                    />
                </div>
            </div>
            {visibleBox &&
                <div className='mt-2'>
                    {visibleBox === "email-message" &&
                        <SolidMessageComposer id={id} refetch={refetch} modelSingularName={modelSingularName} type={"email"} onCancel={onComposerCancel} modelUserKey={modelUserKey} />
                    }

                    {visibleBox === "log" &&
                        <SolidMessageComposer id={id} refetch={refetch} modelSingularName={modelSingularName} onCancel={onComposerCancel} modelUserKey={modelUserKey} />
                    }
                </div>
            }
            <SolidDialog
                open={showFilterDialog}
                onOpenChange={setShowFilterDialog}
                className='solid-filter-dialog-shell solid-chatter-filter-main'
                style={{ width: 500 }}
                showHeader={false}
            >
                <SolidDialogHeader className="solid-filter-dialog-head">
                    <div>
                        <SolidDialogTitle className="solid-filter-dialog-title m-0">Filter Messages</SolidDialogTitle>
                    </div>
                    <SolidDialogClose className="solid-filter-dialog-close" />
                </SolidDialogHeader>
                <SolidDialogSeparator className="solid-filter-dialog-sep" />
                <SolidDialogBody className="solid-filter-dialog-body">
                    <div className="flex flex-column gap-3">
                        <div className="flex flex-column gap-2">
                            <label htmlFor="fullName" className="form-field-label">User</label>
                            <SolidAutocomplete
                                id="fullName"
                                value={filters.name}
                                suggestions={suggestions}
                                field="fullName"
                                completeMethod={searchUsers}
                                onChange={(e) => handleUserChange(e.value)}
                                placeholder="Filter by user"
                                className="w-full"
                                inputClassName="w-full"
                            />
                        </div>
                        <div className="flex flex-column gap-2">
                            <label htmlFor="dateRange" className="form-field-label">Date Range</label>
                            <div className="flex gap-2 flex-column md:flex-row">
                                <div className="flex-1">
                                    <SolidDatePicker
                                        selected={filters.startDate ?? undefined}
                                        onChange={(date: Date | null) => setFilters(prev => ({ ...prev, startDate: date ?? null }))}
                                        placeholderText="Start Date"
                                        className="w-full"
                                        wrapperClassName="w-full"
                                        inputClassName="w-full"
                                    />
                                </div>
                                <div className="flex-1">
                                    <SolidDatePicker
                                        selected={filters.endDate ?? undefined}
                                        onChange={(date: Date | null) => setFilters(prev => ({ ...prev, endDate: date ?? null }))}
                                        placeholderText="End Date"
                                        className="w-full"
                                        wrapperClassName="w-full"
                                        inputClassName="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </SolidDialogBody>
                <SolidDialogFooter>
                        <SolidButton 
                            label="Clear" 
                            size="sm"
                            variant="outline"
                            onClick={handleClearFilters}
                        />
                        <SolidButton 
                            label="Apply" 
                            size="sm"
                            className="solid-purple-button"
                            onClick={handleApplyFilters}
                        />
                </SolidDialogFooter>
            </SolidDialog>
        </div>
    )
}
