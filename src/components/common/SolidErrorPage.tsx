import { Button } from "primereact/button";
import { useRouter } from "../../hooks/useRouter";
import SolidLogo from '../../resources/images/SolidXLogo.svg'
import ErrorSvg from '../../resources/images/errors/error.svg'

type SolidErrorPageProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
};

export const SolidErrorPage = ({
  title = "Error Occurred",
  message = "Something went wrong.",
  actionLabel = "Go to Dashboard",
  actionHref = "/admin",
}: SolidErrorPageProps) => {
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
          <div className="w-full py-8 px-5 sm:px-8 flex flex-column align-items-center m-2" style={{borderRadius: '53px', backgroundColor: 'white'}}>
            <div className="flex justify-content-center align-items-center bg-pink-500 border-circle" style={{height : '3rem', width: '3rem', backgroundColor: 'var(--primary-color)'}}>
              <i className="pi pi-fw pi-exclamation-circle text-2xl text-white" />
            </div>
            <h1 className="text-900 font-bold text-5xl mb-2">{title}</h1>
            <div className="text-600 mb-5">{message}</div>
            <img
              alt="solid error"
              src={ErrorSvg}
              className="mb-5"
            />
            <Button
              label={actionLabel}
              text
              onClick={() => router.push(actionHref)}
              className="mt-2 font-bold"
              icon="pi pi-arrow-left"
              iconPos="left"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
