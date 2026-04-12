import { usePathname } from "../../hooks/usePathname";
import { SolidInput } from "../shad-cn-ui";

export const GlobalSearch = () => {
    const path = usePathname();
    // const placeholderMap: { [key: string]: string } = {
    //     '/menu': 'Search Menus',
    //     '/category': 'Search Categories',
    //     '/menu-item': 'Search Menu Items',
    //     '/cms-banner-image': 'Search CMS Banner Images',
    //     '/article': 'Search Articles',
    // };

    // Find the matching placeholder dynamically
    // const placeholder = Object.keys(placeholderMap).find(key => pathname.includes(key)) || 'Search';

    const getPlaceholder = () => {
        const dynamicSegment = path.split('/').slice(-2, -1)[0]; // Extracts the second-to-last segment
        return `Search ${dynamicSegment.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}`;
    };
    return (
        <div className='absolute left-50 solid-global-search' style={{ transform: 'translateX(-50%)' }}>
            <span className="pi pi-search" />
            <SolidInput
                placeholder={getPlaceholder()}
                className='border-cyan-200 border-1 max-h-2rem w-25rem'
            />
        </div>
    )
}
