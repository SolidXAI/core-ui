import { isButtonVisibleInCurrentEnv } from "../../../../../../helpers/buttonEnvironment";
import { solidGet } from "../../../../../../http/solidHttp";
import { openPopup } from "../../../../../../redux/features/popupSlice";
import { getSolidStoreDispatch } from "../../../../../../redux/store/solidEntityApiPool";
import type { SolidLoadList, SolidListUiEventResponse } from "../../../../../../types/solid-core";

let hasAttemptedResumeLookup = false;
let lastOpenedTransactionKey: string | null = null;

export default async function moduleMetadataListOnLoad(event: SolidLoadList): Promise<SolidListUiEventResponse | void> {
  if (hasAttemptedResumeLookup) {
    return;
  }

  const dispatch = getSolidStoreDispatch();
  if (!dispatch) {
    return;
  }

  const listViewAttrs = (event?.listViewLayout?.attrs ?? {}) as { headerButtons?: any[] };
  const headerButtons = listViewAttrs.headerButtons ?? [];
  const importButton = headerButtons.find((button: any) => button?.attrs?.action === "ModuleImportListHeaderAction");
  if (!importButton?.attrs || !isButtonVisibleInCurrentEnv(importButton?.attrs)) {
    return;
  }

  try {
    const response = await solidGet("/module-packages/import/resumable/latest");
    const transaction = response?.data?.data ?? response?.data;
    hasAttemptedResumeLookup = true;

    if (!transaction?.transactionKey || transaction.transactionKey === lastOpenedTransactionKey) {
      return;
    }

    lastOpenedTransactionKey = transaction.transactionKey;
    dispatch(
      openPopup({
        ...importButton.attrs,
        params: event.params,
        solidListViewMetaData: {
          solidView: event.viewMetadata,
          solidFieldsMetadata: event.fieldsMetadata,
        },
        resumeTransactionKey: transaction.transactionKey,
        autoResume: true,
      }),
    );
  } catch (error) {
    hasAttemptedResumeLookup = false;
    // Ignore resume lookup failures and allow the list to render normally.
  }
}
