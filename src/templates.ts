import { Rect, Circle, Textbox, FabricObject } from "fabric";
import type { Project } from "./storage";
export type Template = {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  layout: "notice" | "schedule" | "info" | "editorial" | "quote" | "art";
  colors: [string, string, string];
  title: string;
  subtitle: string;
  details: string;
  footer: string;
};
const sage: [string, string, string] = ["#f5f3ea", "#40563e", "#dce3d0"];
const sand: [string, string, string] = ["#f7eee3", "#765947", "#e2cbb1"];
const ink: [string, string, string] = ["#efeee8", "#343f48", "#cbd5d3"];
const rose: [string, string, string] = ["#f4eae5", "#79554e", "#dec3b8"];
const olive: [string, string, string] = ["#e8ebdf", "#4c583b", "#c5cfad"];
export const templates: Template[] = [
  {
    id: "clinic-holiday",
    name: "한의원 휴진 안내",
    category: "홍보물",
    width: 794,
    height: 1123,
    layout: "notice",
    colors: sage,
    title: "휴진 안내",
    subtitle: "잠시 쉬어가는 날을 안내드립니다",
    details:
      "휴진일  |  날짜를 입력하세요\n진료 재개  |  날짜를 입력하세요\n\n내원 전 일정을 확인해 주세요.",
    footer: "도경한의원 · 연락처를 입력하세요",
  },
  {
    id: "clinic-hours",
    name: "진료시간 안내",
    category: "홍보물",
    width: 794,
    height: 1123,
    layout: "schedule",
    colors: sand,
    title: "진료시간 안내",
    subtitle: "내원 전 진료 일정을 확인해 주세요",
    details:
      "평일       시간을 입력하세요\n토요일    시간을 입력하세요\n점심       시간을 입력하세요\n휴진       요일을 입력하세요",
    footer: "도경한의원 · 예약 및 문의",
  },
  {
    id: "clinic-season",
    name: "계절 건강 안내문",
    category: "홍보물",
    width: 794,
    height: 1123,
    layout: "info",
    colors: olive,
    title: "계절을 건강하게\n보내는 작은 습관",
    subtitle: "우리 일상에 필요한 건강 이야기",
    details:
      "01  생활 습관을 입력하세요\n\n02  확인한 정보를 입력하세요\n\n03  안내할 내용을 입력하세요",
    footer: "도경한의원 · 교육용 내용은 게시 전 검토해 주세요",
  },
  {
    id: "clinic-info",
    name: "의료 정보 카드",
    category: "홍보물",
    width: 1080,
    height: 1080,
    layout: "info",
    colors: ink,
    title: "한눈에 보는\n건강 이야기",
    subtitle: "오늘의 주제를 입력하세요",
    details: "01  핵심 정보\n02  생활 속 실천 방법\n03  자주 묻는 질문",
    footer: "정보 출처와 검토일을 입력하세요",
  },
  {
    id: "clinic-banner",
    name: "한의원 홈페이지 배너",
    category: "홍보물",
    width: 1600,
    height: 500,
    layout: "editorial",
    colors: sage,
    title: "일상에 건강을 더하다",
    subtitle: "한의원 소개 문구를 입력하세요",
    details: "진료 안내 · 예약 및 문의",
    footer: "도경한의원",
  },
  {
    id: "clinic-poster",
    name: "프로그램 소개 포스터",
    category: "홍보물",
    width: 794,
    height: 1123,
    layout: "notice",
    colors: rose,
    title: "새로운 소식을\n전합니다",
    subtitle: "프로그램 이름을 입력하세요",
    details:
      "기간  |  날짜를 입력하세요\n대상  |  내용을 입력하세요\n문의  |  연락처를 입력하세요",
    footer: "도경한의원 · 게시 전 내용을 확인해 주세요",
  },
  {
    id: "blog-title",
    name: "블로그 제목 썸네일",
    category: "블로그",
    width: 1200,
    height: 630,
    layout: "editorial",
    colors: sand,
    title: "오늘의 이야기를\n여기에 담아보세요",
    subtitle: "나의 블로그 · 새로운 기록",
    details: "부제나 핵심 키워드를 입력하세요",
    footer: "MY PERSONAL JOURNAL",
  },
  {
    id: "blog-health",
    name: "건강 블로그 썸네일",
    category: "블로그",
    width: 1200,
    height: 630,
    layout: "editorial",
    colors: sage,
    title: "궁금했던 건강 이야기",
    subtitle: "알아두면 좋은 생활 정보",
    details: "이번 글의 주제를 입력하세요",
    footer: "도경한의원 · 블로그",
  },
  {
    id: "blog-cover",
    name: "에세이 커버",
    category: "블로그",
    width: 1200,
    height: 630,
    layout: "quote",
    colors: ink,
    title: "느리게 바라보면\n보이는 것들",
    subtitle: "ESSAY · 나의 일상 기록",
    details: "짧은 소개 문장을 입력하세요",
    footer: "글쓴이 이름을 입력하세요",
  },
  {
    id: "blog-body",
    name: "본문 요약 카드",
    category: "블로그",
    width: 1080,
    height: 1080,
    layout: "info",
    colors: sand,
    title: "오늘의 핵심 정리",
    subtitle: "이야기를 한 장에 담다",
    details: "01  첫 번째 요점\n\n02  두 번째 요점\n\n03  기억하고 싶은 문장",
    footer: "블로그 이름 · 출처를 입력하세요",
  },
  {
    id: "blog-tall",
    name: "세로형 블로그 커버",
    category: "블로그",
    width: 1000,
    height: 1500,
    layout: "notice",
    colors: olive,
    title: "나의 취향을\n기록하는 시간",
    subtitle: "LIFE & INSPIRATION",
    details: "이 글을 소개하는 문장을\n여기에 입력하세요.",
    footer: "나의 블로그",
  },
  {
    id: "art-landscape",
    name: "고요한 풍경 구성",
    category: "일러스트",
    width: 1200,
    height: 800,
    layout: "art",
    colors: sage,
    title: "고요한 오후",
    subtitle: "A QUIET AFTERNOON",
    details: "",
    footer: "작품명 · 작가 이름",
  },
  {
    id: "art-abstract",
    name: "추상 형태 포스터",
    category: "일러스트",
    width: 794,
    height: 1123,
    layout: "art",
    colors: rose,
    title: "마음의 모양",
    subtitle: "FORMS OF FEELING",
    details: "",
    footer: "나만의 색과 형태로 바꿔보세요",
  },
  {
    id: "art-study",
    name: "색상과 분위기 스터디",
    category: "일러스트",
    width: 1080,
    height: 1080,
    layout: "art",
    colors: olive,
    title: "오늘의 색",
    subtitle: "COLOR & MOOD STUDY",
    details: "느낌과 영감을 기록하세요",
    footer: "개인 창작 스터디",
  },
  {
    id: "personal-quote",
    name: "좋아하는 문장 카드",
    category: "개인 작품",
    width: 1080,
    height: 1080,
    layout: "quote",
    colors: sand,
    title: "작은 순간에도\n나만의 빛이 있다",
    subtitle: "WORDS TO KEEP",
    details: "간직하고 싶은 문장으로 바꿔보세요",
    footer: "직접 쓴 글 또는 출처를 입력하세요",
  },
  {
    id: "personal-music",
    name: "음악에서 온 영감",
    category: "개인 작품",
    width: 1080,
    height: 1080,
    layout: "quote",
    colors: ink,
    title: "소리가 머문 자리",
    subtitle: "INSPIRED BY MUSIC",
    details: "곡을 듣고 떠오른 감정을 적어보세요",
    footer: "곡명 · 아티스트를 입력하세요",
  },
  {
    id: "personal-exhibit",
    name: "개인 전시 초대장",
    category: "개인 작품",
    width: 794,
    height: 1123,
    layout: "notice",
    colors: olive,
    title: "나의 작은\n전시에 초대합니다",
    subtitle: "A PERSONAL COLLECTION",
    details:
      "전시명  |  제목을 입력하세요\n기간     |  날짜를 입력하세요\n장소     |  장소를 입력하세요",
    footer: "작가 이름 · 연락처",
  },
  {
    id: "personal-wallpaper",
    name: "데스크톱 배경 작품",
    category: "개인 작품",
    width: 1920,
    height: 1080,
    layout: "art",
    colors: sand,
    title: "나의 속도로",
    subtitle: "AT MY OWN PACE",
    details: "",
    footer: "MY ATELIER",
  },
];
export type ElementSpec = {
  type: "rect" | "circle" | "text";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  text?: string;
  size?: number;
  serif?: boolean;
};
export function templateElements(t: Template): ElementSpec[] {
  const {
    width: w,
    height: h,
    colors: [, fg, accent],
  } = t;
  const p = w * 0.085;
  const compact = w / h > 2;
  const titleSize = Math.min(
    w * 0.075,
    h * (t.layout === "quote" ? 0.09 : 0.112),
  );
  const contentY =
    t.layout === "quote"
      ? w > h
        ? 0.28
        : 0.36
      : t.layout === "art"
        ? 0.18
        : 0.22;
  const elements: ElementSpec[] = [];
  const rect = (x: number, y: number, ew: number, eh: number, color: string) =>
    elements.push({ type: "rect", x, y, w: ew, h: eh, color });
  const circle = (x: number, y: number, d: number, color: string) =>
    elements.push({ type: "circle", x, y, w: d, h: d, color });
  const text = (
    value: string,
    x: number,
    y: number,
    ew: number,
    size: number,
    serif = false,
  ) => {
    if (value)
      elements.push({
        type: "text",
        text: value,
        x,
        y,
        w: ew,
        h: size * 1.4,
        color: fg,
        size,
        serif,
      });
  };
  if (t.layout === "art") {
    circle(w * 0.56, h * 0.22, Math.min(w * 0.42, h * 0.45), accent);
    rect(w * 0.11, h * 0.54, w * 0.45, h * 0.24, fg);
    circle(w * 0.43, h * 0.5, Math.min(w * 0.3, h * 0.27), accent);
  } else if (t.layout === "editorial") {
    rect(w * 0.77, 0, w * 0.23, h, accent);
    circle(w * 0.8, h * 0.25, Math.min(w * 0.16, h * 0.4), fg);
  } else if (t.layout === "quote") {
    circle(w * 0.7, h * 0.12, w * 0.12, accent);
    rect(p, h * 0.73, w * 0.14, 3, fg);
  } else {
    rect(p, h * 0.15, w * 0.18, 4, fg);
    rect(
      p,
      h * 0.49,
      w - 2 * p,
      h * (t.layout === "info" ? 0.35 : 0.28),
      accent,
    );
  }
  const titleWidth = t.layout === "editorial" ? w * 0.63 : w - 2 * p;
  text(t.subtitle, p, h * 0.075, w * 0.8, Math.min(w * 0.021, h * 0.04));
  text(t.title, p, h * contentY, titleWidth, titleSize, true);
  const detailY =
    t.layout === "quote"
      ? 0.68
      : t.layout === "art"
        ? 0.83
        : compact || t.layout === "editorial"
          ? 0.7
          : 0.53;
  text(
    t.details,
    p + (t.layout === "info" || t.layout === "schedule" ? w * 0.025 : 0),
    h * detailY,
    t.layout === "editorial" ? w * 0.6 : w * 0.78,
    Math.min(w * 0.029, h * 0.043),
  );
  text(t.footer, p, h * 0.91, w * 0.82, Math.min(w * 0.019, h * 0.032));
  return elements;
}
export function createFromTemplate(t: Template): Project {
  const objects: FabricObject[] = templateElements(t).map((e) =>
    e.type === "text"
      ? new Textbox(e.text!, {
          left: e.x,
          top: e.y,
          width: e.w,
          fontSize: e.size,
          fontFamily: e.serif
            ? "Noto Serif KR Variable"
            : "Noto Sans KR Variable",
          fill: e.color,
          lineHeight: 1.45,
        })
      : e.type === "circle"
        ? new Circle({ left: e.x, top: e.y, radius: e.w / 2, fill: e.color })
        : new Rect({
            left: e.x,
            top: e.y,
            width: e.w,
            height: e.h,
            fill: e.color,
          }),
  );
  return {
    id: crypto.randomUUID(),
    name: t.name,
    category: t.category,
    width: t.width,
    height: t.height,
    background: t.colors[0],
    canvas: { version: "6.7.0", objects: objects.map((o) => o.toObject()) },
    thumbnail: "",
    updated: Date.now(),
    status: "draft",
    favorite: false,
  };
}
