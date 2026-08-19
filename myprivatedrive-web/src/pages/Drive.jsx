import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";
import FilePreviewModal from "../components/FilePreviewModal";
import { T } from "../styleTokens";
import { FolderIcon, FileIcon, StarIcon, EditIcon, MoveIcon, TrashIcon, DownloadIcon, UploadCloudIcon } from "../components/icons";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Breadcrumb({ ancestors, current }) {
  const trail = [...ancestors, ...(current ? [current] : [])];

  return (
    <div className={"mb-1.5 flex flex-wrap items-center gap-1.5 text-xs " + T.textTertiary}>
      <Link to="/" className={T.linkHover}>MyPrivateDrive</Link>
      {trail.map((folder) => (
        <span key={folder.id} className="flex items-center gap-1.5">
          <span>/</span>
          <Link to={`/folders/${folder.id}`} className={T.linkHover}>{folder.name}</Link>
        </span>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-2 p-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded-lg bg-[#f4f5f7] dark:bg-[#171b24]" />
      ))}
    </div>
  );
}

export default function Drive() {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const [contents, setContents] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [renamingFolderId, setRenamingFolderId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [movingFolderId, setMovingFolderId] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const path = folderId ? `/folders/${folderId}` : "/folders";
      const { data } = await api.get(path);
      setContents(data);
    } catch {
      showToast("Não foi possível carregar o conteúdo.", "error");
    }
  }, [folderId, showToast]);

  useEffect(() => {
    setContents(null);
    load();
  }, [load]);

  const loadOrganizations = useCallback(() => {
    api
      .get("/organizations")
      .then(({ data }) => setOrganizations(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const query = folderId ? `?folderId=${folderId}` : "";
      await api.post(`/files/upload${query}`, formData);
      showToast(`"${file.name}" enviado com sucesso.`);
    } catch {
      showToast(`Falha no upload de "${file.name}".`, "error");
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadFile(file);
    await load();
    event.target.value = "";
  }

  // Drag events fire on every element boundary the cursor crosses, not just when leaving the
  // whole zone, so a plain boolean flickers as the cursor moves over child elements. A counter
  // (incremented on enter, decremented on leave, reset on drop) only clears the highlight once
  // the cursor has actually left every nested element.
  function handleDragEnter(event) {
    event.preventDefault();
    dragCounterRef.current += 1;
    setIsDraggingOver(true);
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event) {
    event.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDraggingOver(false);
  }

  async function handleDrop(event) {
    event.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);

    const files = Array.from(event.dataTransfer.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      await uploadFile(file);
    }
    await load();
  }

  async function handleDownload(file) {
    try {
      const response = await api.get(`/files/${file.id}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.originalName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast("Falha ao baixar o arquivo.", "error");
    }
  }

  async function handleCreateFolder(event) {
    event.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await api.post("/folders", { name: newFolderName, parentFolderId: folderId ?? null });
      showToast(`Pasta "${newFolderName}" criada.`);
      setNewFolderName("");
      await load();
    } catch {
      showToast("Falha ao criar pasta.", "error");
    }
  }

  function startRename(folder) {
    setRenamingFolderId(folder.id);
    setRenameValue(folder.name);
  }

  async function submitRename(event, folderIdToRename) {
    event.preventDefault();
    if (!renameValue.trim()) return;

    try {
      await api.put(`/folders/${folderIdToRename}`, { name: renameValue });
      showToast("Pasta renomeada.");
      setRenamingFolderId(null);
      await load();
    } catch {
      showToast("Falha ao renomear pasta.", "error");
    }
  }

  async function handleMoveFolder(folder, destination) {
    if (!destination) return;

    try {
      const body = destination === "root" ? { moveToRoot: true } : { parentFolderId: destination };
      await api.put(`/folders/${folder.id}`, body);
      showToast(`Pasta "${folder.name}" movida.`);
      setMovingFolderId(null);
      await load();
    } catch {
      showToast("Falha ao mover pasta.", "error");
    }
  }

  async function handleDeleteFolder(folder) {
    try {
      await api.delete(`/folders/${folder.id}`);
      showToast(`Pasta "${folder.name}" movida para a lixeira.`);
      await load();
    } catch {
      showToast("Falha ao excluir pasta.", "error");
    }
  }

  async function handleDeleteFile(file) {
    try {
      await api.delete(`/files/${file.id}`);
      showToast(`"${file.originalName}" movido para a lixeira.`);
      await load();
    } catch {
      showToast("Falha ao excluir arquivo.", "error");
    }
  }

  async function handleToggleFolderFavorite(folder) {
    try {
      await api.put(`/folders/${folder.id}/favorite`);
      await load();
    } catch {
      showToast("Falha ao atualizar favorito.", "error");
    }
  }

  async function handleToggleFileFavorite(file) {
    try {
      await api.put(`/files/${file.id}/favorite`);
      await load();
    } catch {
      showToast("Falha ao atualizar favorito.", "error");
    }
  }

  const isEmpty = contents && contents.subfolders.length === 0 && contents.files.length === 0;
  const pageName = contents?.folder?.name ?? "Meus Arquivos";

  return (
    <Layout>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative min-h-[calc(100vh-8rem)] rounded-2xl"
      >
        {isDraggingOver && (
          <div className="pointer-events-none absolute -inset-3 z-10 rounded-2xl border-2 border-dashed border-[#3b6fef] bg-[#3b6fef]/5 dark:border-[#5b8cff] dark:bg-[#5b8cff]/8" />
        )}

        <div className="mb-7">
          <Breadcrumb ancestors={contents?.ancestors ?? []} current={contents?.folder ?? null} />
          <h1 className="text-[26px] font-bold tracking-tight">{pageName}</h1>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleCreateFolder} className="flex gap-2">
            <input
              type="text"
              placeholder="Nova pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className={T.input}
            />
            <button type="submit" className={T.btnGhost}>Criar pasta</button>
          </form>

          <button type="button" onClick={() => fileInputRef.current?.click()} className={T.btnPrimary}>
            <UploadCloudIcon className="h-3.5 w-3.5" />
            Enviar arquivo
          </button>
          <input ref={fileInputRef} type="file" onChange={handleUpload} hidden />
        </div>

        <div className={"overflow-hidden rounded-2xl border " + T.borderSoft + " " + T.surface + " shadow-sm"}>
          {contents === null && <LoadingSkeleton />}

          {isEmpty && (
            <p className={"px-5 py-8 text-center text-sm " + T.textSecondary}>
              Nenhum arquivo ou pasta aqui ainda. Arraste arquivos aqui para enviar.
            </p>
          )}

          {contents && !isEmpty && (
            <ul>
              {contents.subfolders.map((folder) => (
                <li
                  key={folder.id}
                  onClick={
                    renamingFolderId === folder.id || movingFolderId === folder.id
                      ? undefined
                      : () => navigate(`/folders/${folder.id}`)
                  }
                  className={
                    "flex items-center justify-between border-b px-5 py-3 last:border-0 transition-colors hover:bg-[#3b6fef]/6 dark:hover:bg-[#5b8cff]/10 " +
                    T.borderSoft +
                    (renamingFolderId === folder.id || movingFolderId === folder.id ? "" : " cursor-pointer")
                  }
                >
                  {renamingFolderId === folder.id ? (
                    <form onSubmit={(e) => submitRename(e, folder.id)} className="flex flex-1 gap-2">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        autoFocus
                        className={T.input}
                      />
                      <button type="submit" className={T.btnPrimarySm}>Salvar</button>
                      <button type="button" onClick={() => setRenamingFolderId(null)} className={T.btnGhostSm}>Cancelar</button>
                    </form>
                  ) : movingFolderId === folder.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <span className="flex-1 text-sm">Mover "{folder.name}" para:</span>
                      <select
                        autoFocus
                        defaultValue=""
                        onChange={(e) => handleMoveFolder(folder, e.target.value)}
                        className={T.input + " w-auto"}
                      >
                        <option value="" disabled>Selecione o destino...</option>
                        <option value="root">Meus Arquivos (raiz)</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.rootFolderId}>{org.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setMovingFolderId(null)} className={T.btnGhostSm}>Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleToggleFolderFavorite(folder); }}
                        className="text-amber-400"
                        title={folder.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <StarIcon className="h-4 w-4" filled={folder.isFavorite} />
                      </button>
                      <span className={"ml-3 flex flex-1 items-center gap-2.5 " + T.linkHover}>
                        <FolderIcon className={"h-4 w-4 shrink-0 " + T.accentText} />
                        {folder.name}
                      </span>
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => startRename(folder)} className={T.btnGhostSm} title="Renomear">
                          <EditIcon className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => { loadOrganizations(); setMovingFolderId(folder.id); }} className={T.btnGhostSm} title="Mover">
                          <MoveIcon className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDeleteFolder(folder)} className={T.btnDangerSm} title="Excluir">
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}

              {contents.files.map((file) => (
                <li
                  key={file.id}
                  onDoubleClick={() => setPreviewFile(file)}
                  className={"flex items-center justify-between border-b px-5 py-3 last:border-0 " + T.borderSoft}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleFileFavorite(file)}
                    className="text-amber-400"
                    title={file.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    <StarIcon className="h-4 w-4" filled={file.isFavorite} />
                  </button>
                  <span className="ml-3 flex flex-1 items-center gap-2.5">
                    <FileIcon className={"h-4 w-4 shrink-0 " + T.textTertiary} />
                    {file.originalName}
                    <span className={"text-xs " + T.textTertiary}>({formatSize(file.sizeBytes)})</span>
                  </span>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => handleDownload(file)} className={T.btnPrimarySm} title="Baixar">
                      <DownloadIcon className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDeleteFile(file)} className={T.btnDangerSm} title="Excluir">
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </Layout>
  );
}
