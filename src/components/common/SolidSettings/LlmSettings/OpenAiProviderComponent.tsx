import { SolidInput, SolidPasswordInput } from "../../../shad-cn-ui";

export const OpenAiProviderComponent = ({ profile, onUpdate }: any) => {
  return (
    <div className="flex flex-column gap-4 mt-3">
      <div className="flex flex-column gap-2">
        <label className="form-field-label">Base URL</label>
        <SolidInput
          placeholder="https://api.provider.com"
          value={profile?.baseUrl || ""}
          onChange={(e) => onUpdate("baseUrl", e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex flex-column gap-2">
        <label className="form-field-label">API Key</label>
        <SolidPasswordInput
          className="w-full"
          value={profile?.apiKey || ""}
          onChange={(e) => onUpdate("apiKey", e.target.value)}
          toggle
        />
      </div>
      <div className="flex flex-column gap-2">
        <label className="form-field-label">Model Name</label>
        <SolidInput
          placeholder="e.g. gpt-4o-mini"
          value={profile?.modelName || ""}
          onChange={(e) => onUpdate("modelName", e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
};
