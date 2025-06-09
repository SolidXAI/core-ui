import { Button } from 'primereact/button'
import styles from './SolidImport.module.css'

export const SolidImportTransaction = ({ setImportTransactionContext }: any) => {
    return (
        <div>
            <div className={styles.SolidImportContextWrapper}>SolidImportTransaction</div>
            <div className='mt-3 flex align-items-center gap-3'>
                <Button label='Import' size='small' />
                <Button label='Cancel' size='small' outlined onClick={() => setImportTransactionContext(false)} />
            </div>
        </div>
    )
}