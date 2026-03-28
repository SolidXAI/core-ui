import { SolidButton } from "../shad-cn-ui/SolidButton";

type SolidErrorStatePageProps = {
  eyebrow?: string;
  statusCode?: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
};

export const SolidErrorStatePage = ({
  eyebrow = "Whoops!",
  statusCode,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: SolidErrorStatePageProps) => {
  const handleAction = () => {
    if (onAction) {
      onAction();
      return;
    }
    if (actionHref) {
      window.location.href = actionHref;
    }
  };

  return (
    <div className="solid-error-page">
      <section className="solid-error-page__content">
        <div className="solid-error-page__copy">
          <p className="solid-error-page__eyebrow">{eyebrow}</p>
          <h1 className="solid-error-page__title">{title}</h1>
          <p className="solid-error-page__description">{description}</p>
          <SolidButton
            size="lg"
            className="solid-error-page__cta"
            onClick={handleAction}
          >
            {actionLabel}
          </SolidButton>
        </div>
      </section>
      <section className="solid-error-page__visual" aria-hidden="true">
        <div className="solid-error-page__visual-card">
          {statusCode ? <span className="solid-error-page__code">{statusCode}</span> : null}
        </div>
      </section>
    </div>
  );
};
