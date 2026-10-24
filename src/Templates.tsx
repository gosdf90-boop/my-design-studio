import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import {
  templates,
  templateElements,
  createFromTemplate,
  type Template,
} from "./templates";
import type { Project } from "./storage";
function Preview({ template: t }: { template: Template }) {
  return (
    <svg
      viewBox={`0 0 ${t.width} ${t.height}`}
      role="img"
      aria-label={`${t.name} 미리보기`}
    >
      <rect width={t.width} height={t.height} fill={t.colors[0]} />
      {templateElements(t).map((e, i) =>
        e.type === "rect" ? (
          <rect
            key={i}
            x={e.x}
            y={e.y}
            width={e.w}
            height={e.h}
            fill={e.color}
          />
        ) : e.type === "circle" ? (
          <circle
            key={i}
            cx={e.x + e.w / 2}
            cy={e.y + e.w / 2}
            r={e.w / 2}
            fill={e.color}
          />
        ) : (
          <text
            key={i}
            fill={e.color}
            fontSize={e.size}
            fontFamily={
              e.serif ? "Noto Serif KR Variable" : "Noto Sans KR Variable"
            }
          >
            {e.text?.split("\n").map((line, j) => (
              <tspan key={j} x={e.x} y={e.y + e.size! + j * e.size! * 1.45}>
                {line}
              </tspan>
            ))}
          </text>
        ),
      )}
    </svg>
  );
}
export default function Templates({ open }: { open: (p: Project) => void }) {
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const shown = templates.filter(
    (t) =>
      (category === "전체" || category === t.category) &&
      `${t.name} ${t.title}`.includes(query),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MADE FOR YOUR EVERYDAY CREATION</div>
          <h1>나의 템플릿 서랍</h1>
          <p>한의원 안내부터 블로그와 개인 작품까지, 내 이야기로 바꿔보세요.</p>
        </div>
        <span className="pill">18 EDITABLE FORMATS</span>
      </div>
      <div className="template-intro">
        대화에서 말씀하신 제작 용도를 바탕으로 새로 구성했습니다. 모든 문구와
        도형은 개별 편집할 수 있습니다.
        <br />
        날짜·진료시간·연락처는 실제 정보로 바꾸고, 공식 로고는 스튜디오의 ‘원본
        로고 삽입’으로 넣어주세요. 의료 정보는 게시 전 직접 검토해 주세요.
      </div>
      <div className="gallery-toolbar">
        <div className="tabs">
          {["전체", "홍보물", "블로그", "일러스트", "개인 작품"].map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={16} />
          <input
            aria-label="템플릿 검색"
            placeholder="템플릿 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="template-grid">
        {shown.map((t) => (
          <article className="template-card" key={t.id}>
            <button
              className="template-preview"
              onClick={() => open(createFromTemplate(t))}
              aria-label={`${t.name} 사용하기`}
            >
              <Preview template={t} />
            </button>
            <div className="template-card-info">
              <span className="small-muted">
                {t.category} · {t.width} × {t.height} px
              </span>
              <h2>{t.name}</h2>
              <button
                className="text-button"
                onClick={() => open(createFromTemplate(t))}
              >
                이 템플릿으로 시작 <ArrowUpRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!shown.length && (
        <div className="empty-state">
          검색 결과가 없어요. 다른 이름으로 찾아보세요.
        </div>
      )}
      <p className="template-footnote">
        템플릿은 새 작품으로 열립니다. ‘작품 저장’을 누르면 갤러리에 보관되며
        원래 템플릿과 기존 작품은 바뀌지 않습니다. 일러스트 템플릿은 편집 가능한
        도형 구성으로, AI가 생성한 그림이 아닙니다.
      </p>
    </>
  );
}
