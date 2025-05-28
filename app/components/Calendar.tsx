/**
 * Calendar 컴포넌트
 *
 * 주요 기능:
 * 1. 월별 캘린더 표시
 * 2. 날짜 선택 기능
 * 3. 이전/다음 달 이동
 * 4. 오늘 날짜로 이동
 * 5. 선택된 날짜 하이라이트 표시
 * 6. 이전/다음 달의 날짜를 연한 색상으로 표시
 */

import { Ionicons } from "@expo/vector-icons";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import TodoList from "./TodoList";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  user_id: string;
}

interface CalendarProps {
  userName?: string;
  onLogout?: () => void;
}

export default function Calendar({ userName, onLogout }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });

  // 항상 6주(42일)를 표시하도록 계산
  const calendarDays = Array.from({ length: 42 }, (_, i) =>
    addDays(calendarStart, i)
  );

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      const startDate = format(calendarStart, "yyyy-MM-dd");
      const endDate = format(addDays(calendarStart, 41), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) {
        Alert.alert("오류", "할 일을 불러오는데 실패했습니다.");
        return;
      }

      setTodos(data || []);
    } catch (error) {
      Alert.alert("오류", "할 일을 불러오는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const onDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isDateToday = (date: Date) => isSameDay(date, new Date());

  const getDayColor = (date: Date) => {
    if (!isSameMonth(date, currentDate)) {
      return "#bdbdbd"; // 이전/다음 달의 날짜는 회색
    }
    const day = date.getDay();
    if (day === 0) return "#FF3B30"; // 일요일: 빨간색
    if (day === 6) return "#007AFF"; // 토요일: 파란색
    return "#333"; // 평일: 기본 색상
  };

  const getIncompleteTodoCount = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dateTodos = todos.filter((todo) => todo.date === dateKey);
    return dateTodos.filter((todo) => !todo.completed).length;
  };

  useEffect(() => {
    fetchTodos();
  }, [currentDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.userHeader}>
            <Text style={styles.userName}>
              {userName ? `🤗 ${userName}` : "안녕하세요!"}
            </Text>
            <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <View style={styles.headerGroup}>
                <TouchableOpacity
                  onPress={previousMonth}
                  style={styles.iconButton}
                >
                  <Ionicons name="chevron-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                  {format(currentDate, "yyyy년 MM월", { locale: ko })}
                </Text>
                <TouchableOpacity onPress={nextMonth} style={styles.iconButton}>
                  <Ionicons name="chevron-forward" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.todayButton,
                  isDateToday(selectedDate) && styles.todayButtonDisabled,
                ]}
                onPress={goToToday}
                disabled={isDateToday(selectedDate)}
              >
                <Text
                  style={[
                    styles.todayButtonText,
                    isDateToday(selectedDate) && styles.todayButtonTextDisabled,
                  ]}
                >
                  오늘
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                <Text
                  key={day}
                  style={[
                    styles.weekDay,
                    index === 0 && styles.sundayText,
                    index === 6 && styles.saturdayText,
                  ]}
                >
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.dates}>
              {calendarDays.map((date) => {
                const incompleteTodoCount = getIncompleteTodoCount(date);
                return (
                  <TouchableOpacity
                    key={date.toString()}
                    style={[
                      styles.dateButton,
                      !isSameMonth(date, currentDate) && styles.otherMonthDate,
                      isDateToday(date) &&
                        !isSameDay(date, selectedDate) &&
                        styles.todayDate,
                      isSameDay(date, selectedDate) && styles.selectedDate,
                    ]}
                    onPress={() => onDatePress(date)}
                  >
                    {incompleteTodoCount > 0 && (
                      <View style={styles.todoIndicator}>
                        <Text style={styles.todoCount}>
                          {incompleteTodoCount}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.dateText,
                        { color: getDayColor(date) },
                        isDateToday(date) &&
                          !isSameDay(date, selectedDate) &&
                          styles.todayDateText,
                        isSameDay(date, selectedDate) &&
                          styles.selectedDateText,
                      ]}
                    >
                      {format(date, "d")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TodoList selectedDate={selectedDate} onTodosChange={fetchTodos} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  mainContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 1024,
    alignSelf: "center",
    paddingHorizontal: 16,
    marginTop: Platform.OS === "web" ? 20 : 8,
    height: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
  },
  container: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    width: "100%",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  todayButton: {
    backgroundColor: "#f0f2f5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  todayButtonDisabled: {
    backgroundColor: "#f8f9fa",
  },
  todayButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  todayButtonTextDisabled: {
    color: "#c7c7c7",
  },
  weekDays: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    width: "14.28%",
    textAlign: "center",
    color: "#666",
    fontWeight: "500",
    paddingVertical: 8,
  },
  sundayText: {
    color: "#FF3B30",
  },
  saturdayText: {
    color: "#007AFF",
  },
  dates: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
    position: "relative",
    height: 336,
  },
  dateButton: {
    width: "14.28%",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  dateText: {
    fontSize: 16,
  },
  otherMonthDate: {
    backgroundColor: "#fafafa",
  },
  otherMonthDateText: {
    opacity: 0.3,
  },
  todayDate: {
    backgroundColor: "#f0f2f5",
  },
  todayDateText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  selectedDate: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#007AFF",
    position: "relative",
    zIndex: 1,
  },
  selectedDateText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  todoIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  todoCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  userName: {
    fontSize: 30,
    color: "#000",
    fontWeight: "600",
  },
  logoutButton: {
    padding: 8,
  },
});
