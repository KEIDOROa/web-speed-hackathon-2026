import { AccountMenu } from "@web-speed-hackathon-2026/client/src/components/application/AccountMenu";
import { NavigationItem } from "@web-speed-hackathon-2026/client/src/components/application/NavigationItem";
import { DirectMessageNotificationBadge } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageNotificationBadge";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  activeUser: Models.User | null;
  authReady: boolean;
  authModalId: string;
  newPostModalId: string;
  onLogout: () => void;
}

const NavigationAuthSkeleton = () => (
  <li>
    <div className="flex h-12 w-12 flex-col items-center justify-center sm:h-auto sm:w-24 lg:h-auto lg:w-auto lg:flex-row lg:justify-start lg:rounded-full lg:px-4 lg:py-2">
      <span className="bg-cax-surface-subtle block size-8 animate-pulse rounded-full lg:size-9" />
      <span className="bg-cax-surface-subtle mt-1 hidden h-3 w-12 animate-pulse rounded sm:block lg:mt-0 lg:ml-2 lg:w-20" />
    </div>
  </li>
);

export const Navigation = ({
  activeUser,
  authReady,
  authModalId,
  newPostModalId,
  onLogout,
}: Props) => {
  return (
    <nav className="border-cax-border bg-cax-surface fixed right-0 bottom-0 left-0 z-10 h-12 border-t lg:relative lg:h-full lg:w-48 lg:border-t-0 lg:border-r">
      <div className="relative grid grid-flow-col items-center justify-evenly lg:fixed lg:flex lg:h-full lg:w-48 lg:flex-col lg:justify-between lg:p-2">
        <ul className="grid grid-flow-col items-center justify-evenly lg:grid-flow-row lg:auto-rows-min lg:justify-start lg:gap-2">
          <NavigationItem
            href="/"
            icon={<FontAwesomeIcon iconType="home" styleType="solid" />}
            text="ホーム"
          />
          <NavigationItem
            href="/search"
            icon={<FontAwesomeIcon iconType="search" styleType="solid" />}
            text="検索"
          />
          {!authReady ? <NavigationAuthSkeleton /> : null}
          {authReady && activeUser !== null ? (
            <NavigationItem
              badge={<DirectMessageNotificationBadge />}
              href="/dm"
              icon={<FontAwesomeIcon iconType="envelope" styleType="solid" />}
              text="DM"
            />
          ) : null}
          {authReady && activeUser !== null ? (
            <NavigationItem
              icon={<FontAwesomeIcon iconType="edit" styleType="solid" />}
              command="show-modal"
              commandfor={newPostModalId}
              text="投稿する"
            />
          ) : null}
          {authReady && activeUser !== null ? (
            <NavigationItem
              href={`/users/${activeUser.username}`}
              icon={<FontAwesomeIcon iconType="user" styleType="solid" />}
              text="マイページ"
            />
          ) : null}
          {authReady && activeUser === null ? (
            <NavigationItem
              icon={<FontAwesomeIcon iconType="sign-in-alt" styleType="solid" />}
              text="サインイン"
              command="show-modal"
              commandfor={authModalId}
            />
          ) : null}
          {authReady && activeUser !== null ? (
            <NavigationItem
              href="/crok"
              icon={<CrokLogo className="h-[30px] w-[30px]" />}
              text="Crok"
            />
          ) : null}
          <NavigationItem
            href="/terms"
            icon={<FontAwesomeIcon iconType="balance-scale" styleType="solid" />}
            text="利用規約"
          />
        </ul>

        {!authReady ? (
          <div className="relative hidden lg:block lg:w-full lg:pb-2">
            <div className="bg-cax-surface-subtle mx-auto size-10 animate-pulse rounded-full" />
          </div>
        ) : activeUser !== null ? (
          <AccountMenu user={activeUser} onLogout={onLogout} />
        ) : null}
      </div>
    </nav>
  );
};
