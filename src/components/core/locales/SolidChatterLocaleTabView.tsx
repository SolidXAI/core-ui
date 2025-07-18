import React from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { SolidChatter } from '../chatter/SolidChatter';
import SolidLocale from './SolidLocale';
import './solid-locale.css';
import { SolidXAIModule } from '../solid-ai/SolidXAIModule';
interface Props {
  solidFormViewMetaData: any;
  id: string;
  refreshChatterMessage: boolean;
  setRefreshChatterMessage: (value: boolean) => void;
  activeTab: number;
  selectedLocale: string | null;
  setSelectedLocale: (locale: string | null) => void;
  viewMode: string;
  createMode: boolean;
  //setDefaultLocaleId: (localeId: string) => void;
  handleLocaleChangeRedirect: (locale: string, defaultEntityLocaleId: string, viewMode: string) => void;
  defaultEntityLocaleId: string | null;
  solidFormViewData: any;
  published: string | null;
}

const SolidChatterLocaleTabView: React.FC<Props> = ({
  solidFormViewMetaData,
  id,
  refreshChatterMessage,
  setRefreshChatterMessage,
  selectedLocale,
  setSelectedLocale,
  activeTab,
  viewMode,
  createMode,
  handleLocaleChangeRedirect,
  defaultEntityLocaleId,
  solidFormViewData,
  published
}) => {
  return (
    <TabView className="SolidCustomLocaleTabviewPanels h-full" activeIndex={activeTab}>
      {solidFormViewMetaData?.data?.solidView?.model?.internationalisation &&
        <TabPanel header="Internationalisation" className={`SolidCustomLocaleTab p-2`}>
          <SolidLocale
            setSelectedLocale={setSelectedLocale}
            solidFormViewMetaData={solidFormViewMetaData}
            selectedLocale={selectedLocale}
            id={id}
            viewMode={viewMode}
            createMode={createMode}
            handleLocaleChangeRedirect={handleLocaleChangeRedirect}
            defaultEntityLocaleId={defaultEntityLocaleId}
            applicableLocales={solidFormViewMetaData?.data?.applicableLocales}
            solidFormViewData={solidFormViewData}
            published={published}
          />
        </TabPanel>
      }
      <TabPanel header="Audit Trail" className={`SolidCustomLocaleTab`} headerClassName='p-2'>
        <SolidChatter
          modelSingularName={solidFormViewMetaData?.data?.solidView?.model?.singularName}
          id={id}
          refreshChatterMessage={refreshChatterMessage}
          setRefreshChatterMessage={setRefreshChatterMessage}
        />
      </TabPanel>
      {/* <TabPanel header="SolidX AI" className={`SolidCustomLocaleTab py-2`} contentClassName='h-full'>
        <SolidXAIModule />
      </TabPanel> */}
    </TabView>
  );
};

export default SolidChatterLocaleTabView;
