import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";

export const AnthropicProviderComponent = ({ profile, onUpdate }: any) => {
  return (
    <div className="flex flex-column gap-4 mt-3">
      <div className="flex flex-column gap-2">
        <label className="form-field-label">Base URL</label>
        <InputText
          placeholder="https://api.provider.com"
          value={profile?.baseUrl || ""}
          onChange={(e) => onUpdate("baseUrl", e.target.value)}
          className="w-full"
        />
      </div>
      <div className="flex flex-column gap-2">
        <label className="form-field-label">API Key</label>
        <Password
          className="w-full"
          value={profile?.apiKey || ""}
          onChange={(e) => onUpdate("apiKey", e.target.value)}
          toggleMask
          feedback={false}
          inputClassName="w-full"
        />
      </div>
      <div className="flex flex-column gap-2">
        <label className="form-field-label">Model Name</label>
        <InputText
          placeholder="e.g. claude-3-haiku"
          value={profile?.modelName || ""}
          onChange={(e) => onUpdate("modelName", e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
};
