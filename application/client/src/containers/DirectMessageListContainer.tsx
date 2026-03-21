import { useId } from "react";
import { Helmet } from "react-helmet";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
  authReady: boolean;
}

export const DirectMessageListContainer = ({ activeUser, authModalId, authReady }: Props) => {
  const newDmModalId = useId();

  if (!authReady) {
    return (
      <div className="p-4">
        <Helmet>
          <title>ダイレクトメッセージ - CaX</title>
        </Helmet>
        <h1 className="text-2xl font-bold">ダイレクトメッセージ</h1>
        <p className="text-cax-text-muted mt-2 text-2xl">読み込み中...</p>
      </div>
    );
  }

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインが必要です"
        authModalId={authModalId}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>ダイレクトメッセージ - CaX</title>
      </Helmet>
      <DirectMessageListPage activeUser={activeUser} newDmModalId={newDmModalId} />
      <NewDirectMessageModalContainer id={newDmModalId} />
    </>
  );
};
