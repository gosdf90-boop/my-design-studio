import { useState, useEffect, useRef } from "react";
import { Canvas, IText, Rect, FabricImage, FabricObject } from "fabric";
import {
  Palette,
  Images,
  Upload,
  Type,
  Square,
  Undo2,
  Redo2,
  Download,
  Save,
  Trash2,
  Layers,
  ArrowLeft,
  AlignCenter,
  ImagePlus,
} from "lucide-react";
import { type Project, download } from "./storage";
const categories = ["전체 작품", "홍보물", "블로그", "일러스트", "개인 작품"];
export default function Studio({
  project,
  onSave,
  notify,
  onBack,
  onDirtyChange,
}: {
  project: Project;
  onSave: (p: Project) => Promise<void>;
  notify: (s: string) => void;
  onBack: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const canvas = useRef<Canvas | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const loading = useRef(false);
  const logo = useRef(false);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState(project.name);
  const [category, setCategory] = useState(project.category);
  const [status, setStatus] = useState(project.status);
  const [background, setBackground] = useState(project.background);
  const [zoom, setZoom] = useState(0.5);
  const zoomRef = useRef(0.5);
  const [objects, setObjects] = useState<FabricObject[]>([]);
  const [selected, setSelected] = useState<FabricObject | undefined>();
  const [, redraw] = useState(0);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  const [busy, setBusy] = useState(false);
  const update = () => {
    const c = canvas.current;
    if (!c) return;
    setObjects([...c.getObjects()]);
    setSelected(c.getActiveObject());
    redraw((x) => x + 1);
  };
  const snapshot = () => {
    if (loading.current || !canvas.current) return;
    const json = JSON.stringify(canvas.current.toJSON());
    if (history.current[cursor.current] === json) return;
    history.current = history.current.slice(0, cursor.current + 1);
    history.current.push(json);
    if (history.current.length > 60) history.current.shift();
    cursor.current = history.current.length - 1;
    dirtyRef.current = true;
    setDirty(true);
    update();
  };
  const resize = (z: number) => {
    const c = canvas.current;
    if (!c) return;
    zoomRef.current = z;
    setZoom(z);
    c.setDimensions({ width: project.width * z, height: project.height * z });
    c.setViewportTransform([z, 0, 0, z, 0, 0]);
    c.requestRenderAll();
  };
  useEffect(() => {
    const c = new Canvas(canvasEl.current!, {
      backgroundColor: project.background,
      preserveObjectStacking: true,
      selection: true,
    });
    canvas.current = c;
    let disposed = false;
    loading.current = true;
    document.fonts.ready
      .then(() => c.loadFromJSON(project.canvas))
      .then(() => {
        if (disposed) return;
        c.backgroundColor = project.background;
        const rect = workspace.current?.getBoundingClientRect();
        resize(
          Math.min(
            (rect!.width - 100) / project.width,
            (rect!.height - 100) / project.height,
            0.85,
          ),
        );
        loading.current = false;
        history.current = [JSON.stringify(c.toJSON())];
        cursor.current = 0;
        update();
        setReady(true);
      })
      .catch(() =>
        notify("작품을 불러오지 못했습니다. 백업 파일을 확인해 주세요."),
      );
    c.on("object:added", snapshot);
    c.on("object:removed", snapshot);
    c.on("object:modified", snapshot);
    c.on("text:changed", snapshot);
    c.on("selection:created", update);
    c.on("selection:updated", update);
    c.on("selection:cleared", update);
    const before = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", before);
    return () => {
      disposed = true;
      window.removeEventListener("beforeunload", before);
      void c.dispose();
      canvas.current = null;
    };
  }, []);
  const change = (props: Record<string, unknown>) => {
    if (!selected) return;
    selected.set(props);
    selected.setCoords();
    canvas.current?.requestRenderAll();
    snapshot();
    update();
  };
  async function travel(direction: number) {
    const i = cursor.current + direction;
    if (i < 0 || i >= history.current.length || loading.current) return;
    loading.current = true;
    try {
      await canvas.current!.loadFromJSON(JSON.parse(history.current[i]));
      cursor.current = i;
      setBackground(String(canvas.current!.backgroundColor));
      resize(zoomRef.current);
      update();
      setDirty(true);
      dirtyRef.current = true;
    } finally {
      loading.current = false;
    }
  }
  async function save() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const c = canvas.current!;
      const thumb = c.toDataURL({
        format: "png",
        multiplier:
          Math.min(400 / project.width, 400 / project.height) / zoomRef.current,
      });
      await onSave({
        ...project,
        name: name || "이름 없는 작품",
        category,
        status,
        background: String(c.backgroundColor),
        canvas: c.toJSON(),
        thumbnail: thumb,
        updated: Date.now(),
      });
      setDirty(false);
      dirtyRef.current = false;
      notify("작품을 이 브라우저에 저장했습니다.");
    } catch {
      notify("저장하지 못했습니다. 저장 공간을 확인하고 PNG로 내보내 주세요.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file || !canvas.current) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      notify("PNG, JPG, WebP 파일을 선택해 주세요.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      notify("25MB 이하 이미지를 선택해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = await FabricImage.fromURL(data);
      const scale = Math.min(
        (project.width * (logo.current ? 0.25 : 0.85)) / img.width,
        (project.height * (logo.current ? 0.25 : 0.85)) / img.height,
        1,
      );
      img.set({
        left: project.width * 0.08,
        top: project.height * 0.08,
        scaleX: scale,
        scaleY: scale,
      });
      canvas.current.add(img);
      canvas.current.setActiveObject(img);
      update();
      notify(
        logo.current
          ? "원본 로고를 이미지 레이어로 삽입했습니다."
          : "이미지를 삽입했습니다. 이미지에 포함된 글자는 직접 편집되지 않습니다.",
      );
    } catch {
      notify("이미지를 읽지 못했습니다. 다른 파일을 선택해 주세요.");
    } finally {
      setBusy(false);
    }
  }
  function addText() {
    const t = new IText("여기에 이야기를 담아보세요", {
      left: project.width * 0.12,
      top: project.height * 0.2,
      fontFamily: "Noto Sans KR Variable",
      fontSize: Math.max(24, Math.round(project.width / 22)),
      fill: "#394535",
      lineHeight: 1.3,
    });
    canvas.current!.add(t);
    canvas.current!.setActiveObject(t);
    update();
  }
  function addShape() {
    const r = new Rect({
      left: project.width * 0.15,
      top: project.height * 0.3,
      width: project.width * 0.3,
      height: project.height * 0.2,
      fill: "#aab397",
      rx: 2,
      ry: 2,
    });
    canvas.current!.add(r);
    canvas.current!.setActiveObject(r);
    update();
  }
  function remove() {
    const c = canvas.current!;
    c.getActiveObjects().forEach((o) => c.remove(o));
    c.discardActiveObject();
    update();
  }
  const text = selected instanceof IText ? selected : undefined;
  return (
    <div className="studio">
      <div className="studio-heading">
        <div>
          <button
            className="icon-button"
            aria-label="작업실로 돌아가기"
            onClick={onBack}
          >
            <ArrowLeft size={18} />
          </button>
          <input
            aria-label="작품 이름"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
              dirtyRef.current = true;
            }}
          />
          <span className="save-state">
            {dirty ? "저장하지 않은 변경사항" : "브라우저 로컬 저장"}
          </span>
        </div>
        <div>
          <button
            className="secondary"
            disabled={!ready || busy}
            onClick={save}
          >
            <Save size={16} />
            {busy ? "처리 중…" : "작품 저장"}
          </button>
          <button
            className="primary"
            disabled={!ready || busy}
            onClick={() => {
              try {
                canvas.current!.discardActiveObject();
                canvas.current!.renderAll();
                download(
                  canvas.current!.toDataURL({
                    format: "png",
                    multiplier: 1 / zoomRef.current,
                  }),
                  `${name || "작품"}.png`,
                );
                notify(
                  `${project.width} × ${project.height}px PNG를 내보냈습니다.`,
                );
              } catch {
                notify(
                  "내보내지 못했습니다. 캔버스 크기나 이미지 용량을 확인해 주세요.",
                );
              }
            }}
          >
            <Download size={16} /> PNG 내보내기
          </button>
        </div>
      </div>
      <div className="studio-body">
        <aside className="tool-panel">
          <div className="eyebrow">ADD TO CANVAS</div>
          <button
            disabled={!ready || busy}
            onClick={() => {
              logo.current = false;
              fileInput.current?.click();
            }}
          >
            <Upload size={20} />
            <span>이미지 업로드</span>
          </button>
          <button disabled={!ready} onClick={addText}>
            <Type size={21} />
            <span>텍스트 추가</span>
          </button>
          <button disabled={!ready} onClick={addShape}>
            <Square size={20} />
            <span>도형 추가</span>
          </button>
          <button
            disabled={!ready || busy}
            onClick={() => {
              logo.current = true;
              fileInput.current?.click();
            }}
          >
            <ImagePlus size={20} />
            <span>원본 로고 삽입</span>
          </button>
          <input
            hidden
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <p className="tool-note">
            이미지 속에 이미 포함된 글자는 편집되지 않습니다. 새 텍스트 레이어는
            개별 수정할 수 있어요.
          </p>
          <div className="canvas-info">
            <span>캔버스 규격</span>
            <strong>
              {project.width} × {project.height}
            </strong>
            <small>px · PNG 출력</small>
          </div>
        </aside>
        <section className="canvas-section">
          <div className="canvas-toolbar">
            <div>
              <button
                aria-label="실행 취소"
                className="icon-button"
                disabled={cursor.current <= 0}
                onClick={() => travel(-1)}
              >
                <Undo2 size={18} />
              </button>
              <button
                aria-label="다시 실행"
                className="icon-button"
                disabled={cursor.current >= history.current.length - 1}
                onClick={() => travel(1)}
              >
                <Redo2 size={18} />
              </button>
              <span className="toolbar-divider" />
              <span>
                {project.width} × {project.height} px
              </span>
            </div>
            <div>
              <button
                className="icon-button"
                aria-label="축소"
                onClick={() => resize(Math.max(0.05, zoom - 0.1))}
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                className="icon-button"
                aria-label="확대"
                onClick={() => resize(Math.min(2, zoom + 0.1))}
              >
                +
              </button>
              <button
                className="text-button"
                onClick={() => {
                  const r = workspace.current!.getBoundingClientRect();
                  resize(
                    Math.min(
                      (r.width - 80) / project.width,
                      (r.height - 80) / project.height,
                      1,
                    ),
                  );
                }}
              >
                화면 맞춤
              </button>
            </div>
          </div>
          <div className="canvas-workspace" ref={workspace}>
            <div className="canvas-paper">
              <canvas ref={canvasEl} />
            </div>
          </div>
          <div className="canvas-footer">
            <span>
              <span className="green-dot" /> 원본 이미지는 그대로, 요소마다
              정밀하게
            </span>
            <span>텍스트를 두 번 클릭하면 글자를 편집할 수 있어요</span>
          </div>
        </section>
        <aside className="properties">
          <div className="property-title">작품 설정</div>
          <label>
            분류
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setDirty(true);
                dirtyRef.current = true;
              }}
            >
              {categories.slice(1).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            작품 상태
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as Project["status"]);
                setDirty(true);
                dirtyRef.current = true;
              }}
            >
              <option value="draft">작업 중 · 초안</option>
              <option value="final">최종 완성본</option>
            </select>
          </label>
          <label className="color-label">
            배경색
            <input
              aria-label="배경색"
              type="color"
              value={background}
              onChange={(e) => {
                setBackground(e.target.value);
                canvas.current!.backgroundColor = e.target.value;
                canvas.current!.requestRenderAll();
                snapshot();
              }}
            />
          </label>
          <div className="property-title">선택 요소</div>
          {selected ? (
            <>
              <span className="selection-label">
                {text
                  ? "텍스트 레이어"
                  : selected instanceof FabricImage
                    ? "원본 이미지 레이어"
                    : "도형 레이어"}
              </span>
              {text && (
                <>
                  <label>
                    글꼴
                    <select
                      aria-label="글꼴"
                      value={text.fontFamily}
                      onChange={(e) => change({ fontFamily: e.target.value })}
                    >
                      <option value="Noto Sans KR Variable">
                        포함된 Noto 고딕
                      </option>
                      <option value="Noto Serif KR Variable">
                        포함된 Noto 명조
                      </option>
                      <option value="sans-serif">고딕 · 시스템 한글</option>
                      <option value="serif">명조 · 시스템 한글</option>
                      <option value="monospace">고정폭</option>
                    </select>
                  </label>
                  <div className="two-fields">
                    <label>
                      크기
                      <input
                        aria-label="글자 크기"
                        type="number"
                        min="6"
                        max="600"
                        value={text.fontSize}
                        onChange={(e) =>
                          change({ fontSize: Math.max(6, +e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      굵기
                      <select
                        aria-label="글자 굵기"
                        value={String(text.fontWeight)}
                        onChange={(e) => change({ fontWeight: e.target.value })}
                      >
                        <option value="normal">보통</option>
                        <option value="bold">굵게</option>
                      </select>
                    </label>
                  </div>
                  <div className="two-fields">
                    <label>
                      자간
                      <input
                        aria-label="자간"
                        type="number"
                        value={text.charSpacing}
                        onChange={(e) =>
                          change({ charSpacing: +e.target.value })
                        }
                      />
                    </label>
                    <label>
                      행간
                      <input
                        aria-label="행간"
                        type="number"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={text.lineHeight}
                        onChange={(e) =>
                          change({ lineHeight: +e.target.value })
                        }
                      />
                    </label>
                  </div>
                </>
              )}
              {!(selected instanceof FabricImage) && (
                <label className="color-label">
                  {text ? "글자색" : "도형색"}
                  <input
                    aria-label="요소 색상"
                    type="color"
                    value={
                      typeof selected.fill === "string"
                        ? selected.fill
                        : "#000000"
                    }
                    onChange={(e) => change({ fill: e.target.value })}
                  />
                </label>
              )}
              <label>
                투명도 {Math.round(selected.opacity * 100)}%
                <input
                  aria-label="투명도"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selected.opacity}
                  onChange={(e) => change({ opacity: +e.target.value })}
                />
              </label>
              <div className="element-actions">
                <button
                  className="secondary"
                  onClick={() => {
                    const c = canvas.current!;
                    selected.set({
                      left: (project.width - selected.getScaledWidth()) / 2,
                    });
                    selected.setCoords();
                    c.requestRenderAll();
                    snapshot();
                  }}
                >
                  <AlignCenter size={15} /> 가로 중앙
                </button>
                <button
                  className="icon-button"
                  aria-label="선택 요소 삭제"
                  onClick={remove}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </>
          ) : (
            <p className="small-muted">
              캔버스나 아래 레이어를 선택하면
              <br />
              속성을 수정할 수 있어요.
            </p>
          )}
          <div className="property-title">
            <Layers size={15} /> 레이어 <span>{objects.length}</span>
          </div>
          <div className="layer-list">
            {[...objects].reverse().map((o, i) => (
              <button
                className={o === selected ? "layer selected" : "layer"}
                key={objects.length - i}
                onClick={() => {
                  canvas.current!.setActiveObject(o);
                  canvas.current!.requestRenderAll();
                  update();
                }}
              >
                {o instanceof IText ? (
                  <Type size={15} />
                ) : o instanceof FabricImage ? (
                  <Images size={15} />
                ) : (
                  <Square size={15} />
                )}
                <span>
                  {o instanceof IText
                    ? o.text
                    : o instanceof FabricImage
                      ? "원본 이미지"
                      : "도형"}{" "}
                </span>
                <small>{objects.length - i}</small>
              </button>
            ))}
            {objects.length === 0 && (
              <p className="small-muted">첫 번째 요소를 추가해 보세요.</p>
            )}
          </div>
          {selected && (
            <div className="layer-order">
              <button
                className="text-button"
                onClick={() => {
                  canvas.current!.bringObjectForward(selected);
                  snapshot();
                  update();
                }}
              >
                앞으로
              </button>
              <button
                className="text-button"
                onClick={() => {
                  canvas.current!.sendObjectBackwards(selected);
                  snapshot();
                  update();
                }}
              >
                뒤로
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
