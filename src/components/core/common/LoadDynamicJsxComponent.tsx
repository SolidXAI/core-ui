'use client';
import dynamic from "next/dynamic";

// Fallback component for missing components
const FallbackComponent = ({ componentName }: any) => (
    <div style={{ color: "red" }}>
        Could not load <strong>{componentName}</strong>
    </div>
);

type Props = {
    context: any;
};


export const LoadDynamicJsxComponent = ({ context }: any) => {

    

    const Component = dynamic<Props>(
        async () => {
            try {
               
                const componentName = context?.rowAction?.action?.customComponent.split('/').pop();
                const mod = await import(
                    `@/components/${context?.rowAction?.action?.customComponent}`
                );
                // Return the default export or a named export matching the componentName
                return mod.default || mod[componentName];
            } catch (error) {
                console.error(`Failed to load component "${context?.rowAction?.action?.customComponent}":`, error);
                // Return a fallback component if the import fails
                return () => <FallbackComponent componentName={context?.rowAction?.action?.customComponent} />;
            }
        },
        { ssr: false } // Disable server-side rendering
    );
    return (
        
        <Component context={context}  />
    );
}


