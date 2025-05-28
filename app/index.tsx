import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";

export default function Index() {
  const [isClient, setIsClient] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/login");

  useEffect(() => {
    // 클라이언트 사이드임을 표시
    setIsClient(true);

    // 웹에서만 URL 파라미터 및 경로 확인
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const redirectParam = searchParams.get("redirect");

      console.log("Current path:", currentPath);
      console.log("Redirect param:", redirectParam);

      // GitHub Pages 서브패스 처리
      if (currentPath.includes("/easy-to-do/")) {
        const pathAfterBase = currentPath
          .replace("/easy-to-do/", "")
          .replace("/easy-to-do", "");
        console.log("Path after base:", pathAfterBase);

        if (pathAfterBase && pathAfterBase !== "/") {
          const targetPath = pathAfterBase.startsWith("/")
            ? pathAfterBase
            : `/${pathAfterBase}`;
          const validPaths = ["/login", "/register", "/(app)/main"];

          if (validPaths.includes(targetPath)) {
            setRedirectPath(targetPath);
            return;
          }
        }
      }

      // 리다이렉트 파라미터 처리
      if (redirectParam) {
        const validPaths = ["/login", "/register", "/(app)/main"];
        const targetPath = redirectParam.startsWith("/")
          ? redirectParam
          : `/${redirectParam}`;

        if (validPaths.includes(targetPath)) {
          setRedirectPath(targetPath);
          return;
        }
      }

      // 기본값: 로그인 페이지
      setRedirectPath("/login");
    }
  }, []);

  // 클라이언트가 준비되지 않았으면 로딩 화면 표시
  if (!isClient) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Text style={{ fontSize: 16, color: "#666" }}>Loading...</Text>
      </View>
    );
  }

  console.log("Redirecting to:", redirectPath);
  return <Redirect href={redirectPath as any} />;
}
