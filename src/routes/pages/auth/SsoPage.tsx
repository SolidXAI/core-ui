import { useEffect, useState } from "react";
import { useRouter } from "../../../hooks/useRouter";
import { useSearchParams } from "../../../hooks/useSearchParams";
import { signIn } from "../../../adapters/auth/signIn";
import { SolidSpinner, SolidIcon } from "../../../components/shad-cn-ui";

export function SsoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fn = async () => {
      const email = "";
      const password = "";
      const accessToken = searchParams.get("accessToken");
      const response = await signIn("credentials", {
        redirect: false,
        email,
        password,
        accessToken,
      });

      if (response?.error) {
        setIsLoading(false);
        setError(response.error);
      } else {
        setIsLoading(false);
        setSuccess(true);
        router.push("/admin");
      }
    };

    fn();
  }, [router, searchParams]);

  return (
    <div className="card flex justify-content-center align-items-center" style={{ height: "80vh" }}>
      <div
        className="custom-card md:w-25rem solid-sso-card"
        style={{
          boxShadow:
            "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {isLoading ? (
            <SolidSpinner />
          ) : success ? (
            <SolidIcon name="si-check" style={{ color: "green", fontSize: "30px", fontWeight: "700" }} aria-hidden />
          ) : (
            <SolidIcon name="si-times" style={{ color: "red", fontSize: "30px", fontWeight: "700" }} aria-hidden />
          )}
        </div>
        <p className="m-20" style={{ textAlign: "center" }}>
          {isLoading && `Please wait while we authenticate your profile.`}
          {error && `${error} Your not authenticated`}
        </p>
      </div>
    </div>
  );
}
