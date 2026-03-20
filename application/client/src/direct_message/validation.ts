import { FormErrors } from "redux-form";

import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";

export function normalizeUsernameForLookup(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/^@/, "");
}

export const validate = (
  values: NewDirectMessageFormData,
): FormErrors<NewDirectMessageFormData> => {
  const errors: FormErrors<NewDirectMessageFormData> = {};

  const normalizedUsername = normalizeUsernameForLookup(values.username);

  if (normalizedUsername.length === 0) {
    errors.username = "ユーザー名を入力してください";
  }

  return errors;
};
