import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { initialAuthFromBootstrap } from "@web-speed-hackathon-2026/client/src/utils/bootstrap_auth";
import { clearAuthHintOnClient } from "@web-speed-hackathon-2026/client/src/utils/auth_hint";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const UserProfileContainer = lazy(() => import(/* webpackPrefetch: true */ "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then(m => ({ default: m.UserProfileContainer })));
const PostContainer = lazy(() => import(/* webpackPrefetch: true */ "@web-speed-hackathon-2026/client/src/containers/PostContainer").then(m => ({ default: m.PostContainer })));
const TermContainer = lazy(() => import(/* webpackPrefetch: true */ "@web-speed-hackathon-2026/client/src/containers/TermContainer").then(m => ({ default: m.TermContainer })));
const CrokContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then(m => ({ default: m.CrokContainer })));
const LoadingFallback = () => (
  <div className="p-4">
    <p className="text-cax-text-muted text-2xl">読み込み中...</p>
  </div>
);

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(
    () => initialAuthFromBootstrap().activeUser,
  );
  const [authReady, setAuthReady] = useState(() => initialAuthFromBootstrap().authReady);

  useEffect(() => {
    const applyBootstrap = () => {
      const raw = (window as unknown as { __BOOTSTRAP_ME__?: { status: string; user?: Models.User } })
        .__BOOTSTRAP_ME__;
      if (raw?.status === "ok" && raw.user) {
        setActiveUser(raw.user);
        setAuthReady(true);
      } else if (raw?.status === "guest") {
        setActiveUser(null);
        setAuthReady(true);
      }
    };
    applyBootstrap();
    window.addEventListener("cax-bootstrap-me", applyBootstrap);
    return () => window.removeEventListener("cax-bootstrap-me", applyBootstrap);
  }, []);

  useEffect(() => {
    // If bootstrap already resolved as guest (no auth cookie), skip redundant fetch
    const bootstrap = (window as unknown as { __BOOTSTRAP_ME__?: { status: string } }).__BOOTSTRAP_ME__;
    if (bootstrap?.status === "guest" && authReady) {
      return;
    }
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
        setAuthReady(true);
      })
      .catch((err) => {
        if (err instanceof Response && err.status === 401) {
          setActiveUser(null);
          clearAuthHintOnClient();
        }
        setAuthReady(true);
      });
  }, []);
  const handleAuthSuccessUser = useCallback((user: Models.User) => {
    setActiveUser(user);
    setAuthReady(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    clearAuthHintOnClient();
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();

  return (
    <HelmetProvider>
      <AppPage
        activeUser={activeUser}
        authReady={authReady}
        authModalId={authModalId}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route element={<TimelineContainer />} path="/" />
            <Route
              element={
                <DirectMessageListContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  authReady={authReady}
                />
              }
              path="/dm"
            />
            <Route
              element={
                <DirectMessageContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  authReady={authReady}
                />
              }
              path="/dm/:conversationId"
            />
            <Route element={<SearchContainer />} path="/search" />
            <Route element={<UserProfileContainer />} path="/users/:username" />
            <Route element={<PostContainer />} path="/posts/:postId" />
            <Route element={<TermContainer />} path="/terms" />
            <Route
              element={
                <CrokContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  authReady={authReady}
                />
              }
              path="/crok"
            />
            <Route element={<NotFoundContainer />} path="*" />
          </Routes>
        </Suspense>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={handleAuthSuccessUser} />
      <NewPostModalContainer id={newPostModalId} />
    </HelmetProvider>
  );
};
