import { Button } from "primereact/button";
import { useRouter } from "../../hooks/useRouter";
import SolidLogo from '../../resources/images/SolidXLogo.svg'

type SolidNotFoundPageProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
};

export const SolidNotFoundPage = ({
  title = "Not Found",
  message = "Requested resource is not available.",
  actionLabel = "Go to Dashboard",
  actionHref = "/admin",
}: SolidNotFoundPageProps) => {
  const router = useRouter();

  return (
    <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
      <div className="flex flex-column align-items-center justify-content-center">
        <img
          alt="solid logo"
          src={SolidLogo}
          className="mb-5 w-6rem flex-shrink-0"
        />
        <div style={{ borderRadius: '56px', padding: '0.3px', background: "linear-gradient(rgba(114, 46, 209, 0.6) 0%, rgba(114, 46, 209, 0) 40%)" }}>
          <div className="w-full py-8 px-5 sm:px-8 flex flex-column align-items-center" style={{ borderRadius: '53px', backgroundColor: 'white' }}>
            <span className="text-blue-500 font-bold text-3xl">404</span>
            <h1 className="text-900 font-bold text-5xl mb-2">{title}</h1>
            <div className="text-600 mb-5">{message}</div>
            <Button
              label={actionLabel}
              text
              onClick={() => router.push(actionHref)}
              className="mt-2"
              icon="pi pi-arrow-left"
              iconPos="left"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
