import { useCallback, useEffect, useRef, useState } from "react";
import { SubmissionError } from "redux-form";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AuthModalPage } from "@web-speed-hackathon-2026/client/src/components/auth_modal/AuthModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
  onUpdateActiveUser: (user: Models.User) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_USERNAME: "ユーザー名に使用できない文字が含まれています",
  USERNAME_TAKEN: "ユーザー名が使われています",
};

async function getAuthErrorMessage(err: unknown, type: "signin" | "signup"): Promise<string> {
  const legacy = err as { responseJSON?: unknown };
  if (
    typeof legacy.responseJSON === "object" &&
    legacy.responseJSON !== null &&
    "code" in legacy.responseJSON &&
    typeof (legacy.responseJSON as { code: unknown }).code === "string"
  ) {
    const code = (legacy.responseJSON as { code: string }).code;
    if (code in ERROR_MESSAGES) {
      return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];
    }
  }

  if (err instanceof Response) {
    try {
      const data: unknown = await err.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "code" in data &&
        typeof (data as { code: unknown }).code === "string"
      ) {
        const code = (data as { code: string }).code;
        if (code in ERROR_MESSAGES) {
          return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];
        }
      }
    } catch {
      // JSON でない本文
    }
    return type === "signup" ? "登録に失敗しました" : "パスワードが異なります";
  }

  return type === "signup" ? "登録に失敗しました" : "パスワードが異なります";
}

export const AuthModalContainer = ({ id, onUpdateActiveUser: _onUpdateActiveUser }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleToggle = () => {
      // モーダル開閉時にkeyを更新することでフォームの状態をリセットする
      setResetKey((key) => key + 1);
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      element.removeEventListener("toggle", handleToggle);
    };
  }, [ref, setResetKey]);

  const handleRequestCloseModal = useCallback(() => {
    ref.current?.close();
  }, [ref]);

  const handleSubmit = useCallback(
    async (values: AuthFormData) => {
      try {
        await sendJSON<Models.User>(
          values.type === "signup" ? "/api/v1/signup" : "/api/v1/signin",
          values,
        );
        window.location.reload();
      } catch (err: unknown) {
        const error = await getAuthErrorMessage(err, values.type);
        throw new SubmissionError({
          _error: error,
        });
      }
    },
    [],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      <AuthModalPage
        key={resetKey}
        onRequestCloseModal={handleRequestCloseModal}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};
