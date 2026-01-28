import SolidLogin from "../../../components/auth/SolidLogin";

export function LoginPage() {
  return (
    <SolidLogin
      signInValidatorLabel="Mobile / SAP Code / Dhan Code"
      signInValidatorPlaceholder="Mobile / SAP Code / Dhan Code"
    />
  );
}
