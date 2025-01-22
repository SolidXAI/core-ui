"use client";

import { useRegisterMutation } from "@/redux/api/authApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { ChangeEventHandler, useEffect, useRef, useState } from "react";
import * as Yup from "yup";
import AuthBanner from "../common/AuthBanner";
import { SocialMediaLogin } from "../common/SocialMediaLogin";

const Register = () => {
  const toast = useRef<Toast>(null);
  const [password, setPassword] = useState("");
  const [checked, setChecked] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
  });

  const validationSchema = Yup.object({
    username: Yup.string().required("User Name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const router = useRouter();

  const isFormFieldValid = (formik: any, fieldName: string) =>
    formik.touched[fieldName] && formik.errors[fieldName];

  const [register, { isLoading, error, isSuccess,data }] = useRegisterMutation();

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const initialValues = {
    username: "",
    email: "",
    password: "",
  }

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
      const userData = {
        username: values.username,
        email: values.email,
        password: values.password,
      };

      await register(userData);
      } catch (err) {
        console.log('inside', err);
      } 
    }
  });

  const showError = () => {
    if (error) {
      if ("data" in error) {
        const apiError = error as FetchBaseQueryError;
        const errorMessages = Array.isArray(apiError.data?.message)
          ? apiError.data?.message
          : [apiError.data?.message];

        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: errorMessages.join(", "),
          life: 3000,
        });
      } else {
        const serializedError = error as Error;
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: serializedError.message || "An error occurred",
          life: 3000,
        });
      }
    }
  };

  useEffect(() => {
    if (error) {
      showError();
    }
  }, [error]);

  useEffect(() => {
    if (isSuccess) {
      router.replace("/auth/login");
    }
  }, [isSuccess])
  
  return (
    <div className="h-screen">
      <Toast ref={toast} />
      <div className="grid m-0 h-full">
        <div className="col-12 md:col-12 lg:col-6">
          <div className="flex justify-content-center align-items-center h-full">
            <div className="col-12 sm:col-8">
              <h2 className="text-4xl text-semibold text-start secondary-color mb-0">
                Sign up to Radix Solutions
              </h2>
              <p className="text-sm">Create your account</p>
                  <form onSubmit={formik.handleSubmit}>
                    <div className="flex flex-column gap-2">
                      <label
                        htmlFor="username"
                        className="text-color-secondary"
                      >
                        Username
                      </label>
                      <InputText
                        id="username"
                        name="username"
                        placeholder="username"
                        onChange={formik.handleChange}
                        value={formik.values.username}
                        className={classNames("p-inputtext-sm w-full", {
                          "p-invalid": isFormFieldValid(formik, "name"),
                        })}
                      />
                      {isFormFieldValid(formik, "username") && <Message
                        className="text-red-500 text-sm"
                        severity="error" 
                        text={formik?.errors?.username?.toString()}
                      />}
                    </div>
                    <div className="flex flex-column gap-2 mt-4">
                      <label htmlFor="email" className="text-color-secondary">
                        Email
                      </label>
                      {/* <img
                                                                style={{ cursor: "pointer" }}
                                                                src={`/images/mail-icon.png`}
                                                                alt="Solid"
                                                            /> */}
                      <InputText
                        id="email"
                        name="email"
                        placeholder="Yourgmail@123.com"
                        onChange={formik.handleChange}
                        value={formik.values.email}
                        className={classNames("p-inputtext-sm w-full", {
                          "p-invalid": isFormFieldValid(formik, "name"),
                        })}
                      />
                      {isFormFieldValid(formik, "email") && <Message
                        className="text-red-500 text-sm"
                        severity="error" text={formik?.errors?.email?.toString()}
                      />}
                    </div>
                    <div className="flex flex-column gap-2 mt-4" style={{}}>
                      <label
                        htmlFor="password"
                        className="text-color-secondary"
                      >
                        Password
                      </label>
                      <Password
                        id="password"
                        name="password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        // value={formik.values.password}}
                        toggleMask
                        inputClassName="w-full"
                        className={classNames("p-inputtext-sm w-full s-password-input", {
                          "p-invalid": isFormFieldValid(formik, "password"),
                        })}
                      />
                      {isFormFieldValid(formik, "password") && <Message
                        className="text-red-500 text-sm"
                        severity="error" text={formik?.errors?.password?.toString()}
                      />}
                    </div>
                    <div className="flex align-items-center mt-4">
                      <Checkbox
                        inputId="remember"
                        onChange={(e: any) => setChecked(e.checked)}
                        checked={checked}
                      />
                      <label htmlFor="remember" className="ml-2">
                        Remember me
                      </label>
                    </div>
                    <div className="mt-4">
                      <Button
                        className="w-full secondary-bg-color"
                        label="Create your account"
                        style={{ borderColor: "currentcolor" }}
                        type="submit"
                      />
                    </div>
                  </form>
              <Divider align="center">
                <div className="inline-flex align-items-center text-400">
                  or continue with
                </div>
              </Divider>
              <div className="text-center">
                <div className="text-sm text-400">
                  Don’t have an account ?{" "}
                  <Link href="/auth/login">Sign in</Link>
                </div>
              </div>
              <SocialMediaLogin />
            </div>
          </div>
        </div>
        <div className="col-12 md:col-12 lg:col-6 hidden lg:block p-0">
          <AuthBanner></AuthBanner>
        </div>
      </div>
    </div>
  );
};

export default Register;
