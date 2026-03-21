import { lazy, Suspense, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { HelmetProvider } from "react-helmet";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { CrokContainer } from "@web-speed-hackathon-2026/client/src/containers/CrokContainer";
import { DirectMessageContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer";
import { DirectMessageListContainer } from "@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer";
import { PostContainer } from "@web-speed-hackathon-2026/client/src/containers/PostContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { TimelineContainer } from "@web-speed-hackathon-2026/client/src/containers/TimelineContainer";
import { initialAuthFromBootstrap, setCachedUser, clearCachedUser } from "@web-speed-hackathon-2026/client/src/utils/bootstrap_auth";
import { clearAuthHintOnClient } from "@web-speed-hackathon-2026/client/src/utils/auth_hint";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const NotFoundContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then(m => ({ default: m.NotFoundContainer })));
const NewPostModalContainer = lazy(() => import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then(m => ({ default: m.NewPostModalContainer })));
const UserProfileContainer = lazy(() => import(/* webpackPrefetch: true */ "@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then(m => ({ default: m.UserProfileContainer })));
const TermContainer = lazy(() => import(/* webpackPrefetch: true */ "@web-speed-hackathon-2026/client/src/containers/TermContainer").then(m => ({ default: m.TermContainer })));
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

  const bootstrapMeGenerationRef = useRef(0);

  useLayoutEffect(() => {
    const applyBootstrap = () => {
      const raw = (window as unknown as { __BOOTSTRAP_ME__?: { status: string; user?: Models.User } })
        .__BOOTSTRAP_ME__;
      if (raw?.status === "ok" && raw.user) {
        setCachedUser(raw.user);
        setActiveUser(raw.user);
        setAuthReady(true);
      } else if (raw?.status === "guest") {
        clearCachedUser();
        clearAuthHintOnClient();
        setActiveUser(null);
        setAuthReady(true);
      }
    };
    window.addEventListener("cax-bootstrap-me", applyBootstrap);
    applyBootstrap();
    return () => window.removeEventListener("cax-bootstrap-me", applyBootstrap);
  }, []);

  useEffect(() => {
    const snapshot = bootstrapMeGenerationRef.current;
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        if (snapshot !== bootstrapMeGenerationRef.current) {
          return;
        }
        setCachedUser(user);
        setActiveUser(user);
        setAuthReady(true);
      })
      .catch((err) => {
        if (snapshot !== bootstrapMeGenerationRef.current) {
          return;
        }
        if (err instanceof Response && err.status === 401) {
          setActiveUser(null);
          clearCachedUser();
          clearAuthHintOnClient();
        }
        setAuthReady(true);
      });
  }, []);
  const handleAuthSuccessUser = useCallback((user: Models.User) => {
    bootstrapMeGenerationRef.current += 1;
    setCachedUser(user);
    setActiveUser(user);
    setAuthReady(true);
  }, []);

  const handleLogout = useCallback(async () => {
    bootstrapMeGenerationRef.current += 1;
    await sendJSON("/api/v1/signout", {});
    clearCachedUser();
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
      <Suspense fallback={null}>
        <NewPostModalContainer id={newPostModalId} />
      </Suspense>
    </HelmetProvider>
  );
};
