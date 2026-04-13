# PrimeReact Usage Report (auto-generated)

_Generated 2026-04-11 09:37:13 UTC using `rg -n "primereact" .` across the repository root._

## Summary
- Unique files with `primereact` references: **73**
- Total line hits: **201**

| Category | Files | Line refs |
|---|---:|---:|
| Dependencies & Root Metadata | 2 | 2 |
| Documentation & Checklists | 4 | 43 |
| Application Source & Logic | 63 | 149 |
| Styles & Theme Assets | 3 | 6 |
| Type Declarations & API Surface | 1 | 1 |

## Detailed references by category

### Dependencies & Root Metadata (2 files / 2 refs)

#### `CHANGELOG.md` (1 refs)
- L127: - **Unused imports** — \`capitalize\` (lodash), \`InputSwitch\` (primereact), \`Link\`, \`pascalCase\`, \`KanbanImage\`, \`SolidLayoutViews\`, \`FilterOperator\`/\`FilterRule\`/\`FilterRuleType\`, \`DataTableFilterMeta\` removed from \`SolidListView\` and related files.

#### `package.json` (1 refs)
- L63: "primereact": "^10.8.5",


### Documentation & Checklists (4 files / 43 refs)

#### `docs/primereact-migration-checklist.md` (3 refs)
- L37: - [ ] Prevent new direct \`primereact/*\` imports in migrated areas.
- L83: - [ ] Remove \`primereact\` from \`package.json\`.
- L91: - [ ] Remove \`src/resources/solid-primereact.css\`.

#### `docs/primereact-migration-review.md` (17 refs)
- L5: | Button (\`primereact/button\`) | Some thin wrappers (\`CreateButton\`, \`CancelButton\`, \`BackButton\`), but broad direct usage | \`src/components/core/list/SolidListView.tsx\`, \`src/components/core/tree/SolidTreeView.tsx\`, \`src/components/core/form/SolidFormView.tsx\`, \`src/components/core/model/FieldMetaDataForm.tsx\`, \`src/components/layout/user-profile-menu.tsx\` |
- L6: | Dialog (\`primereact/dialog\`) | \`SolidPopupContainer\`, many direct dialogs in features/forms | \`src/components/common/SolidPopupContainer.tsx\`, \`src/components/core/list/SolidListView.tsx\`, \`src/components/core/tree/SolidTreeView.tsx\`, \`src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx\` |
- L7: | OverlayPanel (\`primereact/overlaypanel\`) | No single adapter; used in config/actions/menus | \`src/components/core/list/SolidListViewConfigure.tsx\`, \`src/components/layout/user-profile-menu.tsx\`, \`src/components/core/form/SolidFormActionHeader.tsx\`, \`src/components/core/kanban/KanbanCard.tsx\` |
- L8: | Toast (\`primereact/toast\`) | \`showToast\` helper + global \`ToastContainer\` pattern | \`src/helpers/showToast.ts\`, \`src/helpers/ToastContainer.tsx\`, \`src/components/core/list/SolidListView.tsx\`, \`src/components/core/tree/SolidTreeView.tsx\` |
- L9: | AutoComplete (\`primereact/autocomplete\`) | \`AutoCompleteField\`, \`MultipleSelectAutoCompleteField\`; relation-field widgets *(single-select now uses \`SolidAutocomplete\` directly)* | \`src/components/common/AutoCompleteField.tsx\`, \`src/components/core/form/fields/relations/SolidRelationManyToOneField.tsx\`, \`src/components/core/form/fields/SolidSelectionDynamicField.tsx\` |
- L10: | DataTable / Column (\`primereact/datatable\`, \`primereact/column\`) | No true adapter; list architecture built on Prime APIs | \`src/components/core/list/SolidListView.tsx\`, \`src/components/core/field/FieldListViewData.tsx\`, \`src/components/core/model/ModelListViewData.tsx\`, \`src/components/core/module/ModuleListViewData.tsx\`, \`src/components/core/users/UserListView.tsx\` |
- L11: | TreeTable (\`primereact/treetable\`) | No adapter; tree logic directly coupled | \`src/components/core/tree/SolidTreeView.tsx\` |
- L12: | TabView (\`primereact/tabview\`) | Used in auth and metadata forms, mostly direct imports | \`src/components/auth/SolidLogin.tsx\`, \`src/components/auth/SolidRegister.tsx\`, \`src/components/core/model/CreateModel.tsx\`, \`src/components/core/model/FieldMetaDataForm.tsx\` |
- L13: | Calendar / Date-time (\`primereact/calendar\`) | No shared adapter for all date/time fields | \`src/components/core/form/fields/SolidDateField.tsx\`, \`src/components/core/form/fields/SolidDateTimeField.tsx\`, \`src/components/core/form/fields/SolidTimeField.tsx\`, \`src/components/core/dashboard/DashboardFilter.tsx\` |
- L14: | Prime theme + \`.p-*\` selectors | Global style layer and theme files heavily target Prime classes/DOM | \`src/resources/solid-primereact.css\`, \`src/resources/globals.css\`, \`src/resources/themes/solid-light-purple/theme.css\`, \`src/resources/themes/solid-dark-purple/theme.css\`, \`src/resources/stylesheets/_config.scss\` |
- L23: - Files importing \`primereact/*\`: **137**
- L41: 3. **Large CSS coupling to Prime DOM/class names** via \`.p-*\` selectors in \`src/resources/globals.css\` and \`src/resources/solid-primereact.css\`
- L47: Full detailed inventory is captured in \`docs/primereact-usage-inventory.md\`.
- L90: - \`src/resources/globals.css\` and \`src/resources/solid-primereact.css\` contain extensive \`.p-*\` selectors that assume Prime DOM structure.
- L97: - \`src/resources/solid-primereact.css\` (~2985 lines)
- L197: - dependencies: \`primereact\`, \`primeicons\`, \`primeflex\` from \`package.json\`
- L201: - \`src/resources/solid-primereact.css\`

#### `docs/primereact-usage-inventory.md` (22 refs)
- L9: - \`primereact/*\` imports
- L20: - Files importing \`primereact/*\`: **137**
- L39: | Theme / \`.p-*\` styles | \`styles.ts\` imports resource style stack | \`src/styles.ts\`, \`src/resources/solid-primereact.css\`, \`src/resources/globals.css\`, \`src/resources/themes/*/theme.css\` |
- L47: | \`primereact/button\` | 99 |
- L48: | \`primereact/toast\` | 41 |
- L49: | \`primereact/dialog\` | 40 |
- L50: | \`primereact/message\` | 38 |
- L51: | \`primereact/column\` | 29 |
- L52: | \`primereact/autocomplete\` | 29 |
- L53: | \`primereact/inputtext\` | 27 |
- L54: | \`primereact/dropdown\` | 27 |
- L55: | \`primereact/divider\` | 18 |
- L56: | \`primereact/overlaypanel\` | 16 |
- L57: | \`primereact/datatable\` | 9 |
- L58: | \`primereact/tabview\` | 7 |
- L59: | \`primereact/calendar\` | 13 |
- L60: | \`primereact/treetable\` | 1 |
- L84: - \`primereact\`
- L91: - \`src/resources/solid-primereact.css\`
- L97: - \`src/resources/solid-primereact.css\` (~2985 lines)
- L108: | \`src/resources/solid-primereact.css\` | 668 |
- L192: - \`src/resources/solid-primereact.css\`

#### `solid-core-ui-shadcn.md` (1 refs)
- L22: - [x] review pass to remove all references to primereact


### Application Source & Logic (63 files / 149 refs)

#### `src/components/auth/AuthLayout.tsx` (2 refs)
- L4: import { Dialog } from "primereact/dialog";
- L8: import { Divider } from "primereact/divider";

#### `src/components/auth/GoogleAuthChecking.tsx` (1 refs)
- L5: import { ProgressSpinner } from 'primereact/progressspinner';

#### `src/components/auth/SolidChangeForcePassword.tsx` (3 refs)
- L6: import { Button } from 'primereact/button';
- L7: import { Message } from 'primereact/message';
- L8: import { Password } from 'primereact/password';

#### `src/components/auth/SolidForgotPassword.tsx` (3 refs)
- L4: import { Button } from "primereact/button";
- L5: import { InputText } from "primereact/inputtext";
- L6: import { Message } from "primereact/message";



#### `src/components/auth/SolidInitialLoginOtp.tsx` (3 refs)
- L5: import { Button } from "primereact/button";
- L6: import { InputOtp } from "primereact/inputotp";
- L7: import { Message } from "primereact/message";

#### `src/components/auth/SolidInitiateRegisterOtp.tsx` (3 refs)
- L5: import { Button } from "primereact/button";
- L6: import { InputOtp } from "primereact/inputotp";
- L7: import { Message } from "primereact/message";



#### `src/components/auth/SolidLogin.tsx` (6 refs)
- L5: import { Button } from "primereact/button";
- L6: import { Divider } from "primereact/divider";
- L7: import { InputText } from "primereact/inputtext";
- L8: import { Message } from "primereact/message";
- L9: import { Password } from "primereact/password";
- L16: import { RadioButton } from "primereact/radiobutton";




#### `src/components/auth/SolidRegister.tsx` (6 refs)
- L6: import { Button } from "primereact/button";
- L7: import { Divider } from "primereact/divider";
- L8: import { InputText } from "primereact/inputtext";
- L9: import { Message } from "primereact/message";
- L10: import { Password } from "primereact/password";
- L15: import { ProgressSpinner } from "primereact/progressspinner";




#### `src/components/auth/SolidResetPassword.tsx` (4 refs)
- L5: import { Button } from "primereact/button";
- L6: import { Message } from "primereact/message";
- L7: import { Password } from "primereact/password";
- L8: import { classNames } from "primereact/utils";


-------------------------------------------------------------------------------------------------------

#### `src/components/common/AutoCompleteField.tsx` (1 refs)
- L3: import { AutoComplete } from "primereact/autocomplete";

#### `src/components/common/CreateButton.tsx` (1 refs)
- L5: import { Button } from 'primereact/button';

#### `src/components/common/DropzonePlaceholder.tsx` (1 refs)
- L3: import { Button } from "primereact/button";

#### `src/components/common/DropzoneUpload.tsx` (1 refs)
- L3: import { Button } from 'primereact/button'

#### `src/components/common/MultipleSelectAutoCompleteField.tsx` (1 refs)
- L2: import { AutoComplete } from "primereact/autocomplete";

#### `src/components/common/SocialMediaLogin.tsx` (1 refs)
- L2: import { Toast } from "primereact/toast";

#### `src/components/common/SolidAdmin.tsx` (1 refs)
- L1: import { Message } from "primereact/message";

#### `src/components/common/SolidFormStepper.tsx` (1 refs)
- L1: import { OverlayPanel } from 'primereact/overlaypanel';

#### `src/components/common/SolidModuleHome.tsx` (1 refs)
- L5: import { Button } from 'primereact/button';

------------------------------------------------------------------------------------------------------------------------------------
#### `src/components/common/SolidSettings/LlmSettings/AiModelConfigTab.tsx` (1 refs)   DONE
- L1: import { Dropdown } from "primereact/dropdown";

#### `src/components/common/SolidSettings/LlmSettings/AnthropicProviderComponent.tsx` (2 refs)
- L1: import { InputText } from "primereact/inputtext";
- L2: import { Password } from "primereact/password";

#### `src/components/common/SolidSettings/LlmSettings/OpenAiProviderComponent.tsx` (2 refs)
- L1: import { InputText } from "primereact/inputtext";
- L2: import { Password } from "primereact/password";

#### `src/components/common/SolidSettings/SettingDropzoneActivePlaceholder.tsx` (1 refs)
- L1: import { Button } from 'primereact/button'

#### `src/components/common/SolidSettings/SettingsImageRemoveButton.tsx` (1 refs)
- L1: import { Button } from 'primereact/button'

#### `src/components/core/common/SolidLayoutViews.tsx` (3 refs)
- L2: import { Button } from 'primereact/button';
- L3: import { OverlayPanel } from 'primereact/overlaypanel';
- L4: import { RadioButton } from 'primereact/radiobutton';

#### `src/components/core/common/SolidListViewOptions.tsx` (1 refs)
- L2: import { Dialog } from "primereact/dialog";

#### `src/components/core/dashboard/DashboardFilter.tsx` (7 refs)
- L2: import { Button } from "primereact/button";
- L3: import { Dialog } from "primereact/dialog";
- L4: import { Dropdown } from "primereact/dropdown";
- L5: import { Calendar } from "primereact/calendar";
- L6: import { AutoComplete, AutoCompleteCompleteEvent } from "primereact/autocomplete";
- L10: import { Divider } from "primereact/divider";
- L11: import { Fieldset } from "primereact/fieldset";

#### `src/components/core/dashboard/PrimeDataTableWrapper.tsx` (1 refs)
- L3: import { ProgressSpinner } from "primereact/progressspinner";

#### `src/components/core/dashboard/SolidDashboard.tsx` (2 refs)
- L3: import { Button } from 'primereact/button';
- L4: import { Tooltip } from "primereact/tooltip";

#### `src/components/core/dashboard/SolidDashboardBody.tsx` (1 refs)
- L15: import { Toast } from 'primereact/toast';

#### `src/components/core/dashboard/SolidDashboardLoading.tsx` (1 refs)
- L2: import { Skeleton } from 'primereact/skeleton'

#### `src/components/core/dashboard/SolidDashboardVariable.tsx` (5 refs)
- L3: import { AutoComplete, AutoCompleteChangeEvent, AutoCompleteCompleteEvent } from "primereact/autocomplete";
- L4: import { Calendar } from "primereact/calendar";
- L5: import { Nullable } from "primereact/ts-helpers";
- L9: import { ProgressSpinner } from "primereact/progressspinner";
- L11: import { Button } from "primereact/button";

#### `src/components/core/extension/solid-core/dashboardQuestion/ChartFormPreviewWidget.tsx` (1 refs)
- L4: import { Message } from 'primereact/message';

#### `src/components/core/extension/solid-core/roleMetadata/RolePermissionsManyToManyFieldWidget.tsx` (4 refs)
- L2: import { Message } from "primereact/message";
- L3: import { Panel } from "primereact/panel";
- L5: import { Button } from "primereact/button";
- L8: import { Checkbox } from "primereact/checkbox";



#### `src/components/core/form/SolidFormActionHeader.tsx` (1 refs)
- L10: import { Button } from "primereact/button";

#### `src/components/core/form/SolidFormFieldRender.tsx` (1 refs)
- L3: import { Message } from "primereact/message";

#### `src/components/core/form/SolidFormFooter.tsx` (1 refs)
- L11: import { Button } from "primereact/button";

#### `src/components/core/form/SolidFormUserViewLayout.tsx` (1 refs)
- L3: import { Button } from "primereact/button";

#### `src/components/core/form/SolidFormView.tsx` (4 refs)
- L12: import { Button } from "primereact/button";
- L13: import { Dialog } from "primereact/dialog";
- L39: import { Panel } from "primereact/panel";
- L46: import { ConfirmDialog } from "primereact/confirmdialog";

#### `src/components/core/form/SolidFormViewContextMenuHeaderButton.tsx` (1 refs)
- L1: import { Button } from 'primereact/button';

#### `src/components/core/form/SolidFormViewNormalHeaderButton.tsx` (1 refs)
- L1: import { Button } from 'primereact/button';

#### `src/components/core/form/SolidFormViewShimmerLoading.tsx` (1 refs)
- L4: import { Skeleton } from 'primereact/skeleton'

#### `src/components/core/locales/SolidLocale.tsx` (2 refs)
- L4: import { Divider } from 'primereact/divider';
- L5: import { Dropdown } from 'primereact/dropdown';


#### `src/components/core/model/ModelMetaData.tsx` (1 refs)
- L9: import { classNames } from "primereact/utils";

#### `src/components/core/users/CreateUserRole.tsx` (5 refs)
- L10: import { Button } from "primereact/button";
- L11: import { InputText } from "primereact/inputtext";
- L12: import { Message } from "primereact/message";
- L13: import { Toast } from "primereact/toast";
- L14: import { classNames } from "primereact/utils";


#### `src/components/layout/DashboardHeader.tsx` (2 refs)
- L2: import { Button } from "primereact/button";
- L3: import { Menu } from "primereact/menu";

#### `src/components/layout/FilterMenu.tsx` (3 refs)
- L2: import { Button } from "primereact/button";
- L3: import { Dialog } from "primereact/dialog";
- L4: import { OverlayPanel } from "primereact/overlaypanel";

#### `src/components/layout/GlobalSearch.tsx` (3 refs)
- L2: import { IconField } from 'primereact/iconfield';
- L3: import { InputIcon } from 'primereact/inputicon';
- L4: import { InputText } from 'primereact/inputtext';


#### `src/components/layout/navbar-one.tsx` (4 refs)
- L5: import { Button } from "primereact/button";
- L6: import { IconField } from "primereact/iconfield";
- L7: import { InputIcon } from "primereact/inputicon";
- L8: import { InputText } from "primereact/inputtext";


------------------------------------------------------------------------------------------------------


#### `src/components/core/dashboard/SolidQuestionRenderer.tsx` (3 refs)
- L4: import { Message } from 'primereact/message';
- L5: import { MeterGroup } from 'primereact/metergroup';
- L6: import { ProgressSpinner } from 'primereact/progressspinner';

#### `src/components/core/dashboard/chart-renderers/PrimeReactDatatableRenderer.tsx` (3 refs)
- L3: import { Column } from "primereact/column";
- L4: import { DataTable } from "primereact/datatable";
- L5: import { ProgressSpinner } from "primereact/progressspinner";



#### `src/components/core/field/FieldListViewData.tsx` (4 refs)
- L7: import { Button } from "primereact/button";
- L8: import { Column } from "primereact/column";
- L13: } from "primereact/datatable";
- L14: import { Dialog } from "primereact/dialog";


#### `src/components/core/model/ModelListViewData.tsx` (4 refs)
- L9: import { Button } from "primereact/button";
- L10: import { Column } from "primereact/column";
- L15: } from "primereact/datatable";
- L16: import { Dialog } from "primereact/dialog";


#### `src/components/core/module/ModuleListViewData.tsx` (4 refs)
- L6: import { Button } from "primereact/button";
- L7: import { Column } from "primereact/column";
- L12: } from "primereact/datatable";
- L13: import { Dialog } from "primereact/dialog";



#### `src/components/core/tree/SolidTreeView.tsx` (9 refs)
- L16: import { Button } from "primereact/button";
- L19: import { Dialog } from "primereact/dialog";
- L22: import { TreeTable } from "primereact/treetable";
- L23: import { Dropdown } from "primereact/dropdown";
- L24: import type { TreeNode } from "primereact/treenode";
- L25: import { Column } from "primereact/column";
- L34: import { Divider } from "primereact/divider";
- L42: import { Tooltip } from "primereact/tooltip";
- L47: import { OverlayPanel } from "primereact/overlaypanel";

#### `src/components/core/users/UserListView.tsx` (4 refs)
- L4: import { Button } from "primereact/button";
- L5: import { Column } from "primereact/column";
- L10: } from "primereact/datatable";
- L16: import { Dialog } from "primereact/dialog";

#### `src/components/layout/AdminLayout.tsx` (2 refs)
- L8: import { Dialog } from "primereact/dialog";
- L9: import { Divider } from "primereact/divider";

#### `src/components/layout/AppConfig.tsx` (5 refs)
- L4: import { PrimeReactContext } from 'primereact/api';
- L5: import { Button } from 'primereact/button';
- L6: import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
- L7: import { Sidebar } from 'primereact/sidebar';
- L8: import { classNames } from 'primereact/utils';


#### `src/components/layout/ListingHeader.tsx` (1 refs)
- L2: import { Menu } from "primereact/menu";


#### `src/components/layout/navbar-two-menu.tsx` (1 refs)
- L3: import { PanelMenu } from "primereact/panelmenu";

#### `src/helpers/ToastContainer.tsx` (1 refs)
- L4: import { Toast } from 'primereact/toast';

#### `src/helpers/showToast.ts` (1 refs)
- L1: import { Toast } from "primereact/toast";


#### `src/styles.ts` (1 refs)
- L4: import "./resources/solid-primereact.css";


### Styles & Theme Assets (3 files / 6 refs)

#### `src/resources/solid-primereact.css` (2 refs)
- L102: @layer primereact {
- L2951: @layer primereact {

#### `src/resources/themes/solid-dark-purple/theme.css` (2 refs)
- L315: @layer primereact {
- L5972: @layer primereact {

#### `src/resources/themes/solid-light-purple/theme.css` (2 refs)
- L338: @layer primereact {
- L6038: @layer primereact {


### Type Declarations & API Surface (1 files / 1 refs)

#### `src/types/layout.d.ts` (1 refs)
- L4: import { Toast } from 'primereact/toast';


