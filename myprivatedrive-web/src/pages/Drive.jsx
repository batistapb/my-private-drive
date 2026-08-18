import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext";
import Layout from "../components/Layout";
import FilePreviewModal from "../components/FilePreviewModal";

const dangerBtn = "rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700";
const primaryBtn = "rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700";
const neutralBtn = "rounded-md bg-neutral-500 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-600";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Breadcrumb({ ancestors, current }) {
  const trail = [...ancestors, ...(current ? [current] : [])];

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
      <Link to="/" className="hover:underline">MyPrivateDrive</Link>
      {trail.map((folder) => (
        <span key={folder.id} className="flex items-center gap-1">
          <span>/</span>
          <Link to={`/folders/${folder.id}`} className="hover:underline">{folder.name}</Link>
        </span>
      ))}
    </nav>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded-md bg-neutral-100 dark:bg-neutral-800" />
      ))}
    </div>
  );
}

export default function Drive() {
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

  function handleDragOver(event) {
    event.preventDefault();
    setIsDraggingOver(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDraggingOver(false);
  }

  async function handleDrop(event) {
    event.preventDefault();
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

  return (
    <Layout>
      <Breadcrumb ancestors={contents?.ancestors ?? []} current={contents?.folder ?? null} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form onSubmit={handleCreateFolder} className="flex gap-2">
          <input
            type="text"
            placeholder="Nova pasta"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <button type="submit" className="rounded-md bg-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600">
            Criar pasta
          </button>
        </form>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Enviar arquivo
        </button>
        <input ref={fileInputRef} type="file" onChange={handleUpload} hidden />
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={
          "min-h-[6rem] rounded-md border-2 border-dashed p-2 transition-colors " +
          (isDraggingOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-transparent")
        }
      >
        {contents === null && <LoadingSkeleton />}

        {isEmpty && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Nenhum arquivo ou pasta aqui ainda. Arraste arquivos aqui para enviar.
          </p>
        )}

        {contents && !isEmpty && (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {contents.subfolders.map((folder) => (
              <li key={folder.id} className="flex items-center justify-between py-2">
                {renamingFolderId === folder.id ? (
                  <form onSubmit={(e) => submitRename(e, folder.id)} className="flex flex-1 gap-2">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                      className="flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                    />
                    <button type="submit" className={primaryBtn}>Salvar</button>
                    <button type="button" onClick={() => setRenamingFolderId(null)} className={neutralBtn}>Cancelar</button>
                  </form>
                ) : movingFolderId === folder.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <span className="flex-1 text-sm">Mover "{folder.name}" para:</span>
                    <select
                      autoFocus
                      defaultValue=""
                      onChange={(e) => handleMoveFolder(folder, e.target.value)}
                      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                    >
                      <option value="" disabled>Selecione o destino...</option>
                      <option value="root">Meus Arquivos (raiz)</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.rootFolderId}>{org.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setMovingFolderId(null)} className={neutralBtn}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleFolderFavorite(folder)}
                      className="text-amber-400"
                      title={folder.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      {folder.isFavorite ? "★" : "☆"}
                    </button>
                    <Link to={`/folders/${folder.id}`} className="ml-2 flex-1 hover:underline">📁 {folder.name}</Link>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startRename(folder)} className={neutralBtn}>
                        Renomear
                      </button>
                      <button type="button" onClick={() => { loadOrganizations(); setMovingFolderId(folder.id); }} className={neutralBtn}>
                        Mover
                      </button>
                      <button type="button" onClick={() => handleDeleteFolder(folder)} className={dangerBtn}>
                        Excluir
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
                className="flex items-center justify-between py-2"
              >
                <button
                  type="button"
                  onClick={() => handleToggleFileFavorite(file)}
                  className="text-amber-400"
                  title={file.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  {file.isFavorite ? "★" : "☆"}
                </button>
                <span className="ml-2 flex-1">📄 {file.originalName} ({formatSize(file.sizeBytes)})</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleDownload(file)} className={primaryBtn}>
                    Baixar
                  </button>
                  <button type="button" onClick={() => handleDeleteFile(file)} className={dangerBtn}>
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </Layout>
  );
}
