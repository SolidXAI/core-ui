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
  viewMode:string;
  createMode: boolean;
  //setDefaultLocaleId: (localeId: string) => void;
  handleLocaleChangeRedirect: (locale: string,defaultEntityLocaleId:string) => void;
  applicableLocales?: string[];
  defaultEntityLocaleId:string | null;
  solidFormViewData: any;
  handlePublishBtnClick:(type: string) => void;
}

const SolidChatterLocaleTabView: React.FC<Props> = ({
  solidFormViewMetaData,
  id,
  refreshChatterMessage,
  setRefreshChatterMessage,
  internationalisation,
  selectedLocale,
  setSelectedLocale,
  activeTab,
  viewMode,
  createMode,
  // setDefaultLocaleId,
  handleLocaleChangeRedirect,
  applicableLocales = [],
  defaultEntityLocaleId,
  solidFormViewData,
  handlePublishBtnClick
}) => {
  return (
      <TabView className="solid-locale" activeIndex={activeTab}>
        <TabPanel header="Chatter/Audit Trail" className='p-2' contentClassName='p-0'>
          <SolidChatter
            modelSingularName={solidFormViewMetaData?.data?.solidView?.model?.singularName}
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
          id={id}
          viewMode={viewMode}
          createMode={createMode}
          handleLocaleChangeRedirect={handleLocaleChangeRedirect}
          // setDefaultLocaleId={setDefaultLocaleId} 
          defaultEntityLocaleId={defaultEntityLocaleId}
          applicableLocales={applicableLocales}
          solidFormViewData={solidFormViewData}
          handlePublishBtnClick={handlePublishBtnClick}
          />
        </TabPanel>}
      </TabView>
  );
};

export default SolidChatterLocaleTabView;
function setRefreshChatterMessage(value: boolean): void {
  throw new Error('Function not implemented.');
}

