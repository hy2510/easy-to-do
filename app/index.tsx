import { Redirect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { supabase } from "./lib/supabase";

export default function Index() {
  const [isClient, setIsClient] = useState(false);
  const [redirectHref, setRedirectHref] = useState<string | null>(null);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [appBaseUrl, setAppBaseUrl] = useState<string>("");

  const determineBaseUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      // GitHub Pages의 경우 pathname이 /repoName/ 또는 /repoName/path/to/page 형태임
      if (path.includes("/easy-to-do/")) {
        return "/easy-to-do";
      }
    }
    return "";
  }, []);

  useEffect(() => {
    setIsClient(true);
    const currentBaseUrl = determineBaseUrl();
    setAppBaseUrl(currentBaseUrl);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const processRouting = async () => {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const tokenType = hashParams.get("type");

        if (
          accessToken &&
          refreshToken &&
          (tokenType === "signup" || tokenType === "recovery")
        ) {
          console.log("Index - Processing email verification tokens...");
          setIsProcessingAuth(true);
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error("Index - Session setting error:", error);
            setRedirectHref(currentBaseUrl + "/login");
          } else {
            console.log(
              "Index - Email verification successful, redirecting to main"
            );
            setRedirectHref(currentBaseUrl + "/(app)/main");
          }
          setIsProcessingAuth(false);
          // URL에서 토큰 정리. 전체 경로를 사용해야 함.
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
          return;
        }

        let sessionPathQuery = "";
        let sessionHash = "";
        try {
          sessionPathQuery =
            sessionStorage.getItem("redirect-path-query") || "";
          sessionHash = sessionStorage.getItem("redirect-hash") || "";
          if (sessionPathQuery) {
            sessionStorage.removeItem("redirect-path-query");
            sessionStorage.removeItem("redirect-hash");
            console.log(
              "Index - Session redirect path+query:",
              sessionPathQuery
            );
            console.log("Index - Session redirect hash:", sessionHash);
          }
        } catch (e) {
          console.warn("Index - SessionStorage not available:", e);
        }

        if (sessionPathQuery) {
          // sessionPathQuery는 /easy-to-do/path?query 형태임
          // Expo Router는 앱 내부 경로를 사용하므로, /easy-to-do 부분을 제거해야 함
          const appSpecificPath = sessionPathQuery.startsWith(
            currentBaseUrl + "/"
          )
            ? sessionPathQuery.substring(currentBaseUrl.length)
            : sessionPathQuery; // 기본 경로가 없다면 그대로 사용
          const finalHref = appSpecificPath + sessionHash;
          console.log(`Index - Redirecting from session to: ${finalHref}`);
          setRedirectHref(finalHref);
          return;
        }

        // 만약 현재 경로가 baseUrl과 정확히 일치하거나 baseUrl + '/' 인 경우, 기본 페이지로 리다이렉트
        if (
          window.location.pathname === currentBaseUrl ||
          window.location.pathname === currentBaseUrl + "/"
        ) {
          // 사용자가 이미 인증되었는지 확인하여 /main 또는 /login으로 보낼 수 있습니다.
          // 여기서는 간단히 /login으로 보냅니다.
          const defaultPage = "/login";
          console.log(
            `Index - Redirecting to default page: ${
              currentBaseUrl + defaultPage
            }`
          );
          setRedirectHref(currentBaseUrl + defaultPage);
          return;
        }

        // 위 조건에 해당하지 않고, sessionPathQuery도 없다면,
        // 현재 URL을 그대로 사용하되, Expo Router가 처리할 수 있도록 baseUrl을 제외한 경로를 전달
        const currentAppPath = window.location.pathname.startsWith(
          currentBaseUrl + "/"
        )
          ? window.location.pathname.substring(currentBaseUrl.length)
          : window.location.pathname;
        const currentQueryAndHash =
          window.location.search + window.location.hash;
        const finalHrefFromCurrent = currentAppPath + currentQueryAndHash;
        console.log(
          `Index - Using current URL for Expo Router: ${finalHrefFromCurrent}`
        );
        setRedirectHref(finalHrefFromCurrent);
      };
      processRouting();
    }
  }, [determineBaseUrl]);

  if (!isClient || isProcessingAuth || redirectHref === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Text style={{ fontSize: 16, color: "#666" }}>
          {isProcessingAuth ? "이메일 인증 처리 중..." : "페이지 로딩 중..."}
        </Text>
      </View>
    );
  }

  console.log("Index - Final Redirect Href:", redirectHref);
  // Redirect href가 절대 경로일 수도 있으므로, Expo Router의 Redirect는 상대경로를 기대함.
  // 따라서 appBaseUrl이 있으면 이를 제거한 상대경로를 전달해야 함.
  const expoRouterHref =
    appBaseUrl && redirectHref.startsWith(appBaseUrl + "/")
      ? redirectHref.substring(appBaseUrl.length)
      : redirectHref;
  console.log("Index - Expo Router Href:", expoRouterHref);

  return <Redirect href={expoRouterHref as any} />;
}
