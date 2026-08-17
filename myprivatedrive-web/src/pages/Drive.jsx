import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Drive() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [contents, setContents] = useState(null);
  const [error, setError] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const path = folderId ? `/folders/${folderId}` : "/folders";
      const { data } = await api.get(path);
      setContents(data);
    } catch {
      setError("Não foi possível carregar o conteúdo.");
    }
  }, [folderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const query = folderId ? `?folderId=${folderId}` : "";
      await api.post(`/files/upload${query}`, formData);
      await load();
    } catch {
      setError("Falha no upload do arquivo.");
    } finally {
      event.target.value = "";
    }
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
      setError("Falha ao baixar o arquivo.");
    }
  }

  async function handleCreateFolder(event) {
    event.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await api.post("/folders", { name: newFolderName, parentFolderId: folderId ?? null });
      setNewFolderName("");
      await load();
    } catch {
      setError("Falha ao criar pasta.");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    navigate("/login");
  }

  if (!contents) return <p>Carregando...</p>;

  return (
    <div className="drive-page">
      <header>
        <h1>{contents.folder ? contents.folder.name : "MyPrivateDrive"}</h1>
        <button type="button" onClick={handleLogout}>Sair</button>
      </header>

      {contents.folder?.parentFolderId !== undefined && (
        <Link to={contents.folder?.parentFolderId ? `/folders/${contents.folder.parentFolderId}` : "/"}>
          ← Voltar
        </Link>
      )}

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleCreateFolder} className="new-folder-form">
        <input
          type="text"
          placeholder="Nova pasta"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <button type="submit">Criar pasta</button>
      </form>

      <button type="button" onClick={() => fileInputRef.current?.click()}>
        Enviar arquivo
      </button>
      <input ref={fileInputRef} type="file" onChange={handleUpload} hidden />

      <ul className="folder-list">
        {contents.subfolders.map((folder) => (
          <li key={folder.id}>
            <Link to={`/folders/${folder.id}`}>📁 {folder.name}</Link>
          </li>
        ))}
      </ul>

      <ul className="file-list">
        {contents.files.map((file) => (
          <li key={file.id}>
            <span>📄 {file.originalName} ({formatSize(file.sizeBytes)})</span>
            <button type="button" onClick={() => handleDownload(file)}>Baixar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
