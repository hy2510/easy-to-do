import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export default function Index() {
  const [redirectPath, setRedirectPath] = useState<string>("/login");

  useEffect(() => {
    // 웹에서만 URL 파라미터 확인
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect");

      if (redirect) {
        // 알려진 경로들만 허용
        const validPaths = ["/login", "/register", "/(app)/main"];
        const targetPath = redirect.startsWith("/") ? redirect : `/${redirect}`;

        if (validPaths.includes(targetPath)) {
          setRedirectPath(targetPath);
        } else {
          // 알 수 없는 경로는 로그인으로 리다이렉트
          setRedirectPath("/login");
        }
      }
    }
  }, []);

  return <Redirect href={redirectPath as any} />;
}
