import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Palette,
  Images,
  BookOpen,
  Sparkles,
  Plus,
  ArrowUpRight,
  Search,
  Download,
  Trash2,
  Copy,
  Heart,
  ChevronRight,
  X,
  Check,
  FolderOpen,
  Menu,
  ImagePlus,
  MoreHorizontal,
  Square,
} from "lucide-react";
import {
  type Project,
  listProjects,
  saveProject,
  deleteProject,
  getNote,
  saveNote,
  restoreProjects,
  download,
} from "./storage";
import Studio from "./Studio";
type Page = "dashboard" | "studio" | "gallery" | "illustration" | "brand";
const categories = ["전체 작품", "홍보물", "블로그", "일러스트", "개인 작품"];
const presets = [
  { name: "블로그 썸네일", width: 1200, height: 630 },
  { name: "A4 세로", width: 794, height: 1123 },
  { name: "홈페이지 배너", width: 1600, height: 500 },
  { name: "정사각형", width: 1080, height: 1080 },
];
const art = ["landscape", "botanical", "poster", "abstract"];
export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [editorDirty, setEditorDirty] = useState(false);
  function navigate(next: Page) {
    if (next === page) return;
    if (
      page === "studio" &&
      editorDirty &&
      !confirm("저장하지 않은 변경사항이 있습니다. 나갈까요?")
    )
      return;
    setEditorDirty(false);
    setPage(next);
  }
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState<Project | null>(null);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체 작품");
  const [favorites, setFavorites] = useState(false);
  const [menu, setMenu] = useState(false);
  const [presetIndex, setPresetIndex] = useState(0);
  const backupInput = useRef<HTMLInputElement>(null);
  const refresh = () =>
    listProjects()
      .then(setProjects)
      .catch(() =>
        notify(
          "저장소를 읽을 수 없습니다. 브라우저 저장소 설정을 확인해 주세요.",
        ),
      );
  function notify(t: string) {
    setToast(t);
    setTimeout(() => setToast(""), 4000);
  }
  useEffect(() => {
    refresh();
    getNote().then(setNote);
  }, []);
  function open(p: Project) {
    setActive(p);
    setPage("studio");
  }
  function create(p: (typeof presets)[number], name: string) {
    open({
      id: crypto.randomUUID(),
      name: name || "이름 없는 작품",
      category: "개인 작품",
      width: p.width,
      height: p.height,
      background: "#fffdf8",
      canvas: { objects: [] },
      thumbnail: "",
      updated: Date.now(),
      status: "draft",
      favorite: false,
    });
    setModal(false);
  }
  async function persist(p: Project) {
    await saveProject(p);
    setActive(p);
    await refresh();
  }
  async function favorite(p: Project) {
    try {
      await saveProject({ ...p, favorite: !p.favorite });
      await refresh();
    } catch {
      notify("즐겨찾기를 저장하지 못했습니다.");
    }
  }
  async function duplicate(p: Project) {
    try {
      await saveProject({
        ...p,
        id: crypto.randomUUID(),
        name: p.name + " · 사본",
        status: "draft",
        updated: Date.now(),
      });
      await refresh();
      notify("새 버전을 사본으로 만들었습니다.");
    } catch {
      notify("복제하지 못했습니다.");
    }
  }
  async function remove(p: Project) {
    if (
      confirm(
        `“${p.name}” 작품을 삭제할까요? 백업하지 않은 작품은 복구할 수 없습니다.`,
      )
    ) {
      await deleteProject(p.id);
      await refresh();
    }
  }
  async function backup() {
    download(
      new Blob(
        [
          JSON.stringify({
            format: "my-atelier",
            version: 1,
            projects: await listProjects(),
            note,
          }),
        ],
        { type: "application/json" },
      ),
      "my-atelier-backup.json",
    );
    notify("작품과 메모를 백업했습니다.");
  }
  async function restore(file?: File) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (
        data.format !== "my-atelier" ||
        data.version !== 1 ||
        !Array.isArray(data.projects) ||
        data.projects.some(
          (p: Project) =>
            !p.id ||
            typeof p.name !== "string" ||
            !p.canvas ||
            !Number.isFinite(p.width) ||
            !Number.isFinite(p.height) ||
            p.width < 1 ||
            p.height < 1 ||
            p.width > 5000 ||
            p.height > 5000,
        )
      )
        throw Error();
      if (
        !confirm(
          "백업을 가져올까요? 같은 ID의 작품과 메모는 백업 내용으로 교체됩니다.",
        )
      )
        return;
      await restoreProjects(data.projects);
      if (typeof data.note === "string") {
        await saveNote(data.note);
        setNote(data.note);
      }
      await refresh();
      notify("백업을 복원했습니다.");
    } catch {
      notify("유효한 My Atelier 백업 파일이 아니거나 저장 공간이 부족합니다.");
    }
  }
  const filtered = projects.filter(
    (p) =>
      (category === "전체 작품" || p.category === category) &&
      (!favorites || p.favorite) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="app">
      <aside className={menu ? "sidebar expanded" : "sidebar"}>
        <a className="brand" onClick={() => navigate("dashboard")}>
          <span className="brand-symbol">
            m<span>a</span>
          </span>
          <div>
            My Atelier<small>나만의 작은 예술 작업실</small>
          </div>
        </a>
        <div className="nav-label">MY WORKSPACE</div>
        <nav>
          {(
            [
              { id: "dashboard", icon: LayoutDashboard, label: "나의 작업실" },
              { id: "studio", icon: Palette, label: "이미지 스튜디오" },
              { id: "illustration", icon: Sparkles, label: "일러스트 작업실" },
              { id: "brand", icon: BookOpen, label: "브랜드 라이브러리" },
              { id: "gallery", icon: Images, label: "나의 갤러리" },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={page === id ? "nav-item active" : "nav-item"}
              onClick={() => {
                if (id === "studio" && !active) setModal(true);
                else navigate(id);
                setMenu(false);
              }}
            >
              <Icon size={19} />
              {label}
              {(id === "brand" || id === "illustration") && (
                <span className="soon-dot" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-indicator">
            <span /> 나만의 로컬 작업실
          </div>
          <p>
            모든 작품은 이 브라우저에 저장돼요.
            <br />
            소중한 작업은 파일로 백업해 주세요.
          </p>
          <button className="text-button" onClick={backup}>
            <Download size={14} /> 작업실 백업
          </button>
          <button
            className="text-button"
            onClick={() => backupInput.current?.click()}
          >
            <FolderOpen size={14} /> 백업 복원
          </button>
          <input
            hidden
            ref={backupInput}
            type="file"
            accept="application/json"
            onChange={(e) => {
              restore(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="profile">
            <span>J</span>
            <div>
              나의 아틀리에<small>Personal workspace</small>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMenu(!menu)}
            aria-label="메뉴"
          >
            <Menu size={20} />
          </button>
          <span>
            WORKSPACE <ChevronRight size={12} />{" "}
            {page === "dashboard"
              ? "나의 작업실"
              : page === "gallery"
                ? "나의 갤러리"
                : page === "studio"
                  ? "이미지 스튜디오"
                  : page === "brand"
                    ? "브랜드 라이브러리"
                    : "일러스트 작업실"}
          </span>
          <div>
            <span className="privacy">오직 나를 위한 창작 공간</span>
            <span className="avatar">J</span>
          </div>
        </header>
        {page === "studio" && active ? (
          <Studio
            key={active.id}
            project={active}
            onSave={persist}
            onDirtyChange={setEditorDirty}
            notify={notify}
            onBack={() => {
              navigate("dashboard");
              refresh();
            }}
          />
        ) : (
          <div className="page-content">
            {page === "dashboard" ? (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">A SPACE FOR YOUR IDEAS</div>
                    <h1>오늘은 어떤 영감을 담아볼까요?</h1>
                    <p>
                      작은 생각이 나만의 작품이 되는 곳, 나의 아틀리에입니다.
                    </p>
                  </div>
                  <span className="date-label">나의 속도로, 나의 취향대로</span>
                </div>
                <section className="hero">
                  <div className="hero-copy">
                    <span className="pill">YOUR NEXT MASTERPIECE</span>
                    <h2>
                      마음속에 머물던 생각을,
                      <br />
                      눈앞의 작품으로.
                    </h2>
                    <p>
                      빈 캔버스 위에 이미지와 글을 더해 보세요.
                      <br />
                      당신만의 이야기가 시작됩니다.
                    </p>
                    <button className="primary" onClick={() => setModal(true)}>
                      <Plus size={17} /> 새 작품 만들기{" "}
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                  <div className="hero-art">
                    <div className="art-paper landscape">
                      <div className="sun" />
                      <div className="hill hill-back" />
                      <div className="hill hill-front" />
                      <span>
                        A quiet moment
                        <br />
                        <i>in your atelier.</i>
                      </span>
                    </div>
                    <div className="art-caption">
                      COLLECT MOMENTS, CREATE SOMETHING.
                    </div>
                    <span className="hero-doodle">✳︎</span>
                  </div>
                </section>
                <section className="quick-grid">
                  {[
                    {
                      title: "이미지로 시작하기",
                      desc: "사진이나 이미지를 불러와 작업하기",
                      icon: ImagePlus,
                      preset: 0,
                    },
                    {
                      title: "블로그 썸네일",
                      desc: "이야기의 첫인상을 만드는 1200 × 630",
                      icon: Images,
                      preset: 0,
                    },
                    {
                      title: "A4 안내문 · 포스터",
                      desc: "전하고 싶은 내용을 한 장에 담기",
                      icon: BookOpen,
                      preset: 1,
                    },
                  ].map(({ title, desc, icon: Icon, preset }) => (
                    <button
                      className="quick-card"
                      key={title}
                      onClick={() => {
                        setModal(true);
                        setPresetIndex(preset);
                      }}
                    >
                      <span className="quick-icon">
                        <Icon size={21} />
                      </span>
                      <div>
                        <strong>{title}</strong>
                        <p>{desc}</p>
                      </div>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </section>
                <section className="recent">
                  <div className="section-heading">
                    <h2>
                      이어서 작업하기{" "}
                      <span>
                        {projects
                          .filter((p) => p.status === "draft")
                          .length.toString()
                          .padStart(2, "0")}
                      </span>
                    </h2>
                    <button
                      className="text-button"
                      onClick={() => {
                        navigate("gallery");
                        setCategory("전체 작품");
                      }}
                    >
                      모든 작품 보기 <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {projects.length ? (
                    <div className="project-grid">
                      {projects.slice(0, 4).map((p) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          open={open}
                          favorite={favorite}
                          duplicate={duplicate}
                          remove={remove}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="project-grid examples">
                      {[
                        "고요한 순간의 기록",
                        "초록을 곁에 두는 일",
                        "봄날의 작은 전시",
                        "색으로 남기는 마음",
                      ].map((s, i) => (
                        <button
                          key={s}
                          className="example-card"
                          onClick={() => {
                            setModal(true);
                            setPresetIndex(i === 2 ? 1 : 0);
                          }}
                        >
                          <Art kind={art[i]} />
                          <div className="card-title">
                            {s}
                            <ArrowUpRight size={15} />
                          </div>
                          <div className="card-meta">
                            영감을 위한 샘플 <span>새 작품으로 시작</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
                <div className="bottom-grid">
                  <section className="styles-panel">
                    <div className="section-heading">
                      <h2>나의 취향 팔레트</h2>
                      <span className="small-muted">오늘의 영감</span>
                    </div>
                    <div className="palette-colors">
                      {[
                        "#e3dac9",
                        "#afb69a",
                        "#59674e",
                        "#b3987c",
                        "#e9e5dc",
                      ].map((c) => (
                        <button
                          key={c}
                          style={{ background: c }}
                          title={c}
                          onClick={() => {
                            navigator.clipboard
                              ?.writeText(c)
                              .then(() => notify(`${c} 색상을 복사했습니다.`))
                              .catch(() => notify(`색상 코드: ${c}`));
                          }}
                        />
                      ))}
                    </div>
                    <p>
                      내추럴 어스 <span>따뜻한 여백과 자연의 색</span>
                    </p>
                  </section>
                  <section className="note-panel">
                    <div className="section-heading">
                      <h2>
                        <span>✧</span> 영감 노트
                      </h2>
                      <span className="small-muted">자동 저장</span>
                    </div>
                    <textarea
                      aria-label="영감 노트"
                      placeholder="문득 떠오른 생각, 좋아하는 문장, 다음에 그리고 싶은 것…"
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value);
                        saveNote(e.target.value).catch(() =>
                          notify("메모를 저장하지 못했습니다."),
                        );
                      }}
                    />
                    <span className="note-footer">
                      작은 생각도, 여기에 남겨두세요.
                    </span>
                  </section>
                </div>
                <footer>
                  Made for slow, meaningful creation.
                  <span>MY ATELIER · YOUR CREATIVE SANCTUARY</span>
                </footer>
              </>
            ) : page === "gallery" ? (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">YOUR PERSONAL COLLECTION</div>
                    <h1>나의 갤러리</h1>
                    <p>생각과 취향이 차곡차곡 쌓이는 곳.</p>
                  </div>
                  <button className="primary" onClick={() => setModal(true)}>
                    <Plus size={17} /> 새 작품
                  </button>
                </div>
                <div className="gallery-toolbar">
                  <div className="tabs">
                    {categories.map((c) => (
                      <button
                        className={c === category ? "selected" : ""}
                        onClick={() => setCategory(c)}
                        key={c}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <label className="search">
                    <Search size={16} />
                    <input
                      placeholder="작품 검색"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <button
                    className={
                      favorites ? "icon-button favorited" : "icon-button"
                    }
                    aria-label="즐겨찾기만 보기"
                    onClick={() => setFavorites(!favorites)}
                  >
                    <Heart size={18} />
                  </button>
                </div>
                {filtered.length ? (
                  <div className="project-grid gallery-grid">
                    {filtered.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        open={open}
                        favorite={favorite}
                        duplicate={duplicate}
                        remove={remove}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <Images size={35} />
                    <h2>
                      {projects.length
                        ? "조건에 맞는 작품이 없어요"
                        : "첫 번째 작품을 기다리고 있어요"}
                    </h2>
                    <p>새 캔버스를 열고 나만의 이야기를 담아보세요.</p>
                    <button className="primary" onClick={() => setModal(true)}>
                      새 작품 만들기 <Plus size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="future-page">
                <span className="pill">COMING IN PHASE 02</span>
                {page === "brand" ? (
                  <BookOpen size={45} />
                ) : (
                  <Sparkles size={45} />
                )}
                <h1>
                  {page === "brand" ? "브랜드 라이브러리" : "일러스트 작업실"}
                </h1>
                <p>
                  {page === "brand"
                    ? "브랜드별 로고, 색상, 글꼴과 템플릿을 모으는 공간을 준비하고 있습니다."
                    : "콘셉트와 참고 이미지, 여러 시안을 함께 정리할 공간을 준비하고 있습니다."}
                </p>
                <p>
                  현재 스튜디오에서 원본 로고 삽입과 작품 제작을 사용할 수
                  있습니다.
                </p>
                <button disabled className="secondary">
                  {page === "brand"
                    ? "브랜드 관리 준비 중"
                    : "AI 이미지 생성 · 외부 API 미연결"}
                </button>
                <button className="text-button" onClick={() => setModal(true)}>
                  새 작품 만들기 <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      {modal && (
        <NewProject
          presetIndex={presetIndex}
          close={() => setModal(false)}
          create={create}
        />
      )}{" "}
      {toast && (
        <div role="status" className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
function NewProject({
  presetIndex,
  close,
  create,
}: {
  presetIndex: number;
  close: () => void;
  create: (p: (typeof presets)[number], n: string) => void;
}) {
  const [preset, setPreset] = useState(presetIndex);
  const [name, setName] = useState("");
  const [w, setW] = useState(1200);
  const [h, setH] = useState(800);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault();
          create(
            preset === 4
              ? { name: "자유 규격", width: w, height: h }
              : presets[preset],
            name,
          );
        }}
      >
        <div className="section-heading">
          <div className="eyebrow">A NEW BEGINNING</div>
          <button
            type="button"
            className="icon-button"
            onClick={close}
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>
        <h2>새로운 이야기를 시작해요</h2>
        <p>작품에 어울리는 캔버스를 골라주세요.</p>
        <label>
          작품 이름
          <input
            autoFocus
            placeholder="이름 없는 작품"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </label>
        <div className="preset-grid">
          {[...presets, { name: "자유 규격", width: w, height: h }].map(
            (p, i) => (
              <button
                type="button"
                className={preset === i ? "preset selected" : "preset"}
                key={p.name}
                onClick={() => setPreset(i)}
              >
                <Square size={22} />
                <strong>{p.name}</strong>
                <small>
                  {p.width} × {p.height} px
                </small>
              </button>
            ),
          )}
        </div>
        {preset === 4 && (
          <div className="two-fields">
            <label>
              너비
              <input
                type="number"
                min="100"
                max="5000"
                required
                value={w}
                onChange={(e) => setW(+e.target.value)}
              />
            </label>
            <label>
              높이
              <input
                type="number"
                min="100"
                max="5000"
                required
                value={h}
                onChange={(e) => setH(+e.target.value)}
              />
            </label>
          </div>
        )}
        <button className="primary full" type="submit">
          캔버스 열기 <ArrowUpRight size={17} />
        </button>
      </form>
    </div>
  );
}

function Art({ kind }: { kind: string }) {
  return (
    <div className={"sample-art " + kind}>
      {kind === "landscape" ? (
        <>
          <div className="sun" />
          <div className="hill hill-back" />
          <div className="hill hill-front" />
          <span>
            ordinary days,
            <br />
            <i>extraordinary moments.</i>
          </span>
        </>
      ) : kind === "botanical" ? (
        <>
          <div className="stem" />
          <div className="leaf leaf1" />
          <div className="leaf leaf2" />
          <div className="leaf leaf3" />
          <span>
            자연을 닮은
            <br />
            느린 하루
          </span>
        </>
      ) : kind === "poster" ? (
        <>
          <small>봄을 만나는 시간</small>
          <strong>
            봄의
            <br />
            조각들
          </strong>
          <div className="poster-circle" />
          <span>
            2026. 03 — 05
            <br />A LITTLE EXHIBITION OF SPRING
          </span>
        </>
      ) : (
        <>
          <div className="abstract-one" />
          <div className="abstract-two" />
          <span>forms of feeling.</span>
        </>
      )}
    </div>
  );
}
function ProjectCard({
  project: p,
  open,
  favorite,
  duplicate,
  remove,
}: {
  project: Project;
  open: (p: Project) => void;
  favorite: (p: Project) => void;
  duplicate: (p: Project) => void;
  remove: (p: Project) => void;
}) {
  return (
    <article className="project-card">
      <button className="thumbnail" onClick={() => open(p)}>
        {p.thumbnail ? (
          <img src={p.thumbnail} alt={p.name} />
        ) : (
          <Palette size={30} />
        )}
        <span className={"status " + p.status}>
          {p.status === "final" ? "완성" : "작업 중"}
        </span>
      </button>
      <div className="card-title">
        <button onClick={() => open(p)}>{p.name}</button>
        <button
          className={p.favorite ? "icon-button favorited" : "icon-button"}
          aria-label={`${p.name} 즐겨찾기`}
          onClick={() => favorite(p)}
        >
          <Heart size={16} fill={p.favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-meta">
        {p.category} · {new Date(p.updated).toLocaleDateString("ko-KR")}
        <div>
          <button
            aria-label={`${p.name} 복제`}
            className="icon-button"
            onClick={() => duplicate(p)}
          >
            <Copy size={14} />
          </button>
          <button
            aria-label={`${p.name} 삭제`}
            className="icon-button"
            onClick={() => remove(p)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
