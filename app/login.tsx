import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "./lib/supabase";

// 웹과 모바일에서 모두 작동하는 Alert 함수
const showAlert = (title: string, message: string, onPress?: () => void) => {
  if (Platform.OS === "web") {
    // 웹에서는 window.alert 사용
    window.alert(`${title}\n\n${message}`);
    if (onPress) onPress();
  } else {
    // 모바일에서는 React Native Alert 사용
    if (onPress) {
      Alert.alert(title, message, [{ text: "확인", onPress }]);
    } else {
      Alert.alert(title, message);
    }
  }
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setErrorMessage(""); // 이전 오류 메시지 초기화

      if (!email || !password) {
        const message = "이메일과 비밀번호를 입력해주세요.";
        setErrorMessage(message);
        showAlert("오류", message);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        showAlert("로그인 실패", error.message);
        return;
      }

      if (data?.user) {
        router.replace("/(app)/main");
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      const message = "로그인 중 문제가 발생했습니다.";
      setErrorMessage(message);
      showAlert("오류", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>로그인</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "로그인 중..." : "로그인"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push("/register")}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            계정이 없으신가요? 회원가입
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#333",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  registerButton: {
    marginTop: 20,
    padding: 10,
  },
  registerButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginTop: 10,
  },
});
