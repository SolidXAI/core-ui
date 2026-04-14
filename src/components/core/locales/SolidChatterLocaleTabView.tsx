import React, { useEffect, useMemo, useState } from 'react';
import { SolidChatter } from '../chatter/SolidChatter';
import SolidLocale from './SolidLocale';
import './solid-locale.css';
import { SolidTabGroup } from '../../shad-cn-ui';
// import { SolidAiMainWrapper } from '../solid-ai/SolidAiMainWrapper'; // moved to SolidX Studio panel
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
  actionsAllowed?: string[];
  mcpUrl?: string | null;
}

const mapTabIndexToValue = (index: number, order: string[]) => {
  if (!order.length) return '';
  const safeIndex = Number.isFinite(index) ? index : 0;
  if (safeIndex <= 0) return order[0];
  if (safeIndex >= order.length) return order[order.length - 1];
  return order[safeIndex];
};

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
  published,
  actionsAllowed,
  mcpUrl,
}) => {
  const showWorkflowInfo = Boolean(solidFormViewMetaData?.data?.solidView?.model?.draftPublishWorkflow);

  const tabOrder = useMemo(() => {
    const order: string[] = [];
    if (showWorkflowInfo) {
      order.push('info');
    }
    order.push('audit');
    return order;
  }, [showWorkflowInfo]);

  const [activeTabValue, setActiveTabValue] = useState<string>(() => mapTabIndexToValue(activeTab, tabOrder));

  useEffect(() => {
    const nextValue = mapTabIndexToValue(activeTab, tabOrder);
    setActiveTabValue((prev) => (prev === nextValue ? prev : nextValue));
  }, [activeTab, tabOrder]);

  const tabs: { value: string; label: React.ReactNode; content: React.ReactNode; }[] = [
    ...(showWorkflowInfo
      ? [{
        value: 'info',
        label: 'Info',
        content: (
          <div className="solid-locale-tab-content solid-locale-tab-content--padded">
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
          </div>
        )
      }]
      : []),
    {
      value: 'audit',
      label: 'Audit Trail',
      content: (
        <div className="solid-locale-tab-content">
          <SolidChatter
            modelSingularName={solidFormViewMetaData?.data?.solidView?.model?.singularName}
            id={id}
            refreshChatterMessage={refreshChatterMessage}
            setRefreshChatterMessage={setRefreshChatterMessage}
            actionsAllowed={actionsAllowed}
            title={showWorkflowInfo ? undefined : 'Audit Trail'}
          />
        </div>
      )
    }
  ];

  if (!showWorkflowInfo) {
    return (
      <div className="solid-locale-panel solid-locale-panel--single">
        <div className="solid-locale-tab-content">
          <SolidChatter
            modelSingularName={solidFormViewMetaData?.data?.solidView?.model?.singularName}
            id={id}
            refreshChatterMessage={refreshChatterMessage}
            setRefreshChatterMessage={setRefreshChatterMessage}
            actionsAllowed={actionsAllowed}
            title="Audit Trail"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="solid-locale-panel">
      <SolidTabGroup
        className="solid-locale-tabs h-full"
        listClassName="solid-locale-tabs-list"
        panelClassName="solid-locale-tabs-panel"
        tabs={tabs}
        value={activeTabValue}
        onValueChange={setActiveTabValue}
        tabPosition='left'
      />
    </div>
  );
};

export default SolidChatterLocaleTabView;
