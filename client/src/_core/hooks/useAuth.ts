import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Login is started via startLogin() in the effect below, only when we actually
  // navigate — never during render. startLogin() mints a one-time nonce + writes
  // the state cookie, so calling it per render would overwrite the cookie and
  // desync it from an in-flight login's `state`.
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const [sessionLookupTimedOut, setSessionLookupTimedOut] = useState(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  useEffect(() => {
    if (!meQuery.isLoading) {
      setSessionLookupTimedOut(false);
      return;
    }
    const timeout = window.setTimeout(() => setSessionLookupTimedOut(true), 900);
    return () => window.clearTimeout(timeout);
  }, [meQuery.isLoading]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      // Clear the Preview auto-login token mirrored into sessionStorage, so
      // header-based sessions (Safari ITP / WebView) are logged out too. The
      // backend cookie is cleared by the logout mutation.
      try {
        sessionStorage.removeItem("app-session-cookie");
      } catch {}
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const isDemoHost = typeof window !== "undefined" && (
    window.location.hostname.includes("github.io") ||
    localStorage.getItem("civicnexus-demo-mode") === "true"
  );

  const [demoActive, setDemoActive] = useState<boolean>(() => isDemoHost);

  const enableDemoMode = useCallback(() => {
    localStorage.setItem("civicnexus-demo-mode", "true");
    setDemoActive(true);
  }, []);

  const state = useMemo(() => {
    localStorage.setItem(
      "app-runtime-user-info",
      JSON.stringify(meQuery.data)
    );

    const demoUser = demoActive ? {
      id: 1,
      openId: "demo-brics-user",
      name: "BRICS Delegate (Demo Mode)",
      email: "delegate@civicnexus.org",
      role: "admin" as const,
      loginMethod: "oauth",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } : null;

    const activeUser = meQuery.data ?? demoUser;

    return {
      user: activeUser,
      loading: (meQuery.isLoading && !sessionLookupTimedOut && !demoActive) || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(activeUser),
      isDemoMode: Boolean(demoActive && !meQuery.data),
      enableDemoMode,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    sessionLookupTimedOut,
    demoActive,
    enableDemoMode,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    // Navigate at this moment only. startLogin() mints the nonce + cookie itself.
    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin();
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
