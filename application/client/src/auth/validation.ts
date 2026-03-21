import { FormErrors } from "redux-form";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";

function passwordNeedsSymbol(password: string): boolean {
  if (password.length === 0) {
    return false;
  }
  for (let i = 0; i < password.length; i++) {
    const c = password.charCodeAt(i);
    const isDigit = c >= 48 && c <= 57;
    const isUpper = c >= 65 && c <= 90;
    const isLower = c >= 97 && c <= 122;
    if (!isDigit && !isUpper && !isLower) {
      return false;
    }
  }
  return true;
}

export const validate = (values: AuthFormData): FormErrors<AuthFormData> => {
  const errors: FormErrors<AuthFormData> = {};

  const normalizedName = values.name?.trim() || "";
  const normalizedPassword = values.password?.trim() || "";
  const normalizedUsername = values.username?.trim() || "";

  if (values.type === "signup" && normalizedName.length === 0) {
    errors.name = "名前を入力してください";
  }

  if (normalizedPassword.length === 0) {
    errors.password = "パスワードを入力してください";
  } else if (passwordNeedsSymbol(normalizedPassword)) {
    errors.password = "パスワードには記号を含める必要があります";
  }

  if (normalizedUsername.length === 0) {
    errors.username = "ユーザー名を入力してください";
  } else if (!/^[a-zA-Z0-9_]*$/.test(normalizedUsername)) {
    errors.username = "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです";
  }

  return errors;
};
