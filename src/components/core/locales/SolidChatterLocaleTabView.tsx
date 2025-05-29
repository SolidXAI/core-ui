import React from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { SolidChatter } from '../chatter/SolidChatter';
import SolidLocale from './SolidLocale';
import styles from './SolidLocale.module.css';
   // adjust path as needed

interface Props {
  solidFormViewMetaData: any;
  id: string;
  refreshChatterMessage: boolean;
  setRefreshChatterMessage: (value: boolean) => void;
  activeTab: number;
  internationalisation:boolean;
  selectedLocale: string | null;
  setSelectedLocale: (locale: string | null) => void;
}

const SolidChatterLocaleTabView: React.FC<Props> = ({
  solidFormViewMetaData,
  id,
  refreshChatterMessage,
  setRefreshChatterMessage,
  internationalisation,
  selectedLocale,
  setSelectedLocale,
  activeTab
}) => {
  return (
      <TabView className="solid-locale" activeIndex={activeTab}>
        <TabPanel header="Chatter/Audit Trail" className='p-2' contentClassName='p-0'>
          <SolidChatter
            solidFormViewMetaData={solidFormViewMetaData}
            id={id}
            refreshChatterMessage={refreshChatterMessage}
            setRefreshChatterMessage={setRefreshChatterMessage}
          />
        </TabPanel>
        {internationalisation &&
        <TabPanel header="Internationalisation" className='p-2' contentClassName='p-0'>
          <SolidLocale
          setSelectedLocale={setSelectedLocale}
          solidFormViewMetaData={solidFormViewMetaData}
          selectedLocale={selectedLocale}
          id={id} />
        </TabPanel>}
      </TabView>
  );
};

export default SolidChatterLocaleTabView;
function setRefreshChatterMessage(value: boolean): void {
  throw new Error('Function not implemented.');
}

