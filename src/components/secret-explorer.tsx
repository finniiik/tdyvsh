import { useState } from "react";
import { ArrowLeft, Folder, Image, Film, LockKeyhole, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkFolderPassword, type SecretNode } from "@/lib/secret-folders";
import photo from "@/assets/clue-photo.asset.json";
import video from "@/assets/secret-video.asset.json";

export function SecretExplorer({ root, onClose, onDelete }: { root: SecretNode; onClose: () => void; onDelete: () => void }) {
  const [path, setPath] = useState<SecretNode[]>([root]);
  const [locked, setLocked] = useState<SecretNode | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const current = path.at(-1) ?? root;
  const enter = (node: SecretNode) => {
    if (node.locked) { setLocked(node); setPassword(""); setError(""); }
    else setPath(p => [...p, node]);
  };
  return <div className="secret-overlay" onClick={onClose}>
    <section className="pill secret-window winopen" aria-label="проводник" onClick={e => e.stopPropagation()}>
      <div className="titlebar secret-title"><span>{current.name}</span><Button variant="osIcon" size="icon" aria-label="закрыть проводник" onClick={onClose}><X /></Button></div>
      <div className="secret-toolbar">
        <Button variant="osIcon" size="icon" title="назад" aria-label="назад" disabled={path.length === 1} onClick={() => setPath(p => p.slice(0, -1))}><ArrowLeft /></Button>
        <span className="secret-address">{path.map(p => p.name).join(" / ")}</span>
        <Button variant="osIcon" size="icon" title="удалить эту папку с рабочего стола" aria-label="удалить эту папку" onClick={onDelete}><Trash2 /></Button>
      </div>
      <div className="secret-content">
        {current.media === "photo" ? <img className="secret-photo" src={photo.url} alt="Андрей, 22" /> : current.media === "video" ? <video className="secret-video" src={video.url} controls playsInline preload="metadata" /> :
          <div className="secret-files">{current.children?.map(node => <Button key={node.id} variant="osFile" onClick={() => enter(node)}>
            {node.media === "photo" ? <Image /> : node.media === "video" ? <Film /> : node.locked ? <LockKeyhole /> : <Folder />}<span>{node.name}</span>
          </Button>)}</div>}
      </div>
      <div className="statusbar">{current.media ? current.name : `${current.children?.length ?? 0} объектов`}</div>
    </section>
    {locked && <div className="secret-lock-overlay" onClick={e => e.stopPropagation()}><section className="pill secret-lock" role="dialog" aria-modal="true" aria-label="пароль папки">
      <div className="titlebar secret-title"><span>доступ к папке</span><Button variant="osIcon" size="icon" aria-label="закрыть пароль" onClick={() => setLocked(null)}><X /></Button></div>
      <form className="secret-form" onSubmit={async e => { e.preventDefault(); setChecking(true); try { if (await checkFolderPassword(password)) { setPath(p => [...p, locked]); setLocked(null); } else setError("неверный пароль :)))"); } catch { setError("не удалось проверить пароль — попробуй ещё раз"); } finally { setChecking(false); } }}>
        <LockKeyhole className="secret-lock-symbol" />
        <p>а пароль найди на jpeg картинке в другой папке))) пароль две цифры</p>
        <label htmlFor="secret-password">пароль</label><input id="secret-password" type="password" inputMode="numeric" maxLength={2} autoFocus value={password} onChange={e => { setPassword(e.target.value); setError(""); }} />
        <div className="secret-error" role="status">{error}</div>
        <div className="secret-actions"><Button variant="os" type="submit" disabled={checking}>{checking ? "проверяю…" : "ок"}</Button><Button variant="os" type="button" onClick={() => setLocked(null)}>отмена</Button></div>
      </form>
    </section></div>}
  </div>;
}