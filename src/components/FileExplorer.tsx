import React, { useState, useEffect } from 'react';
import { ClientProfile, FtpFile } from '@/lib/types';
import { Folder, FileText, Trash2, ArrowUpCircle, Loader2, HardDrive, UploadCloud, FolderPlus, Copy, Edit3, Scissors, Search, Calculator, Lock, X, Box } from 'lucide-react';
import CodeEditorModal from './CodeEditorModal';
import ImageViewerModal from './ImageViewerModal';

interface Props {
  client: ClientProfile;
}

interface UploadJob {
  id: string;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
}

export default function FileExplorer({ client }: Props) {
  const [path, setPath] = useState<string>('/');
  const [files, setFiles] = useState<FtpFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; file: FtpFile | null } | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<string>('');
  const [editingContent, setEditingContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [imageViewOpen, setImageViewOpen] = useState(false);
  const [imageViewData, setImageViewData] = useState<{name: string, b64: string} | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  
  // Upload Progress Tracking
  const [uploads, setUploads] = useState<UploadJob[]>([]);

  // Overwrite Confirmation
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<{filesToUpload: {file: File, relativePath: string}[], duplicates: string[]} | null>(null);

  // Tree Navigation
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [folderContents, setFolderContents] = useState<Map<string, FtpFile[]>>(new Map());
  const [expandingFolders, setExpandingFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFiles(path);
    setSearchTerm('');
  }, [client, path]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const preventGlobal = (e: Event) => e.preventDefault();
    window.addEventListener('click', handleClick);
    window.addEventListener('dragover', preventGlobal);
    window.addEventListener('drop', preventGlobal);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('dragover', preventGlobal);
      window.removeEventListener('drop', preventGlobal);
    };
  }, []);

  const loadFiles = async (targetPath: string) => {
    setLoading(true);
    setError('');
    setSelectedFiles(new Set());
    setExpandedPaths(new Set());
    setFolderContents(new Map());
    try {
      const res = await fetch('/api/ftp/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: client, path: targetPath })
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.list);
      }
      else setError(data.error);
    } catch (e: any) {
      setError("Erro de conexão ao listar diretório.");
    } finally {
      setLoading(false);
    }
  };

  const loadSubFiles = async (targetPath: string) => {
    setExpandingFolders(prev => new Set(prev).add(targetPath));
    try {
      const res = await fetch('/api/ftp/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: client, path: targetPath })
      });
      const data = await res.json();
      if (data.success) {
        setFolderContents(prev => {
          const next = new Map(prev);
          next.set(targetPath, data.list);
          return next;
        });
      }
    } catch (e) {
      console.error("Error loading subfiles:", e);
    } finally {
      setExpandingFolders(prev => {
        const next = new Set(prev);
        next.delete(targetPath);
        return next;
      });
    }
  };

  const toggleExpand = (e: React.MouseEvent, folder: FtpFile, currentPath: string) => {
    e.stopPropagation();
    const fullPath = currentPath === '/' ? `/${folder.name}` : `${currentPath}/${folder.name}`;
    
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(fullPath)) {
        next.delete(fullPath);
      } else {
        next.add(fullPath);
        if (!folderContents.has(fullPath)) {
          loadSubFiles(fullPath);
        }
      }
      return next;
    });
  };

  const handleNavigate = (dir: string) => {
    if (path === '/') setPath('/' + dir);
    else setPath(path + '/' + dir);
  };

  const handleNavigateUp = () => {
    if (path === '/') return;
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    setPath('/' + parts.join('/'));
  };

  const handleCreateFolder = async () => {
    const name = prompt('Nome da nova pasta:');
    if (!name?.trim()) return;
    setLoading(true);
    try {
      const dirPath = path === '/' ? `/${name}` : `${path}/${name}`;
      const res = await fetch('/api/ftp/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: client, path: dirPath })
      });
      const data = await res.json();
      if (data.success) loadFiles(path);
      else alert('Erro ao criar pasta: ' + data.error);
    } catch (e) {
      alert('Erro ao conectar.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFile = async (file: FtpFile) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const textExts = ['txt', 'html', 'css', 'js', 'json', 'php', 'md', 'ts', 'jsx', 'tsx', 'xml', 'csv'];
    const isImage = ['jpg','jpeg','png','gif','webp','svg'].includes(ext);

    if (textExts.includes(ext) || isImage) {
      setLoading(true);
      try {
        const filePath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
        const res = await fetch('/api/ftp/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentials: client, path: filePath, encoding: isImage ? 'base64' : 'utf-8' })
        });
        const data = await res.json();
        
        if (data.success) {
          if (isImage) {
            let mime = 'image/'+ext;
            if (ext === 'svg') mime = 'image/svg+xml';
            if (ext === 'jpg') mime = 'image/jpeg';
            setImageViewData({ name: file.name, b64: `data:${mime};base64,${data.content}` });
            setImageViewOpen(true);
          } else {
            setEditingContent(data.content);
            setEditingFile(file.name);
            setEditorOpen(true);
          }
        } else {
          alert('Erro ao baixar arquivo: ' + data.error);
        }
      } catch (e) {
        alert('Erro ao baixar.');
      } finally {
        setLoading(false);
      }
    } else {
      alert(`O arquivo ${file.name} não é suportado pelo editor online.`);
    }
  };

  const handleCalculateSize = async (file: FtpFile) => {
    if (!file.isDirectory) return;
    setLoading(true);
    try {
      const filePath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
      const res = await fetch('/api/ftp/size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: client, path: filePath })
      });
      const data = await res.json();
      if (data.success) {
        const mb = (data.size / 1024 / 1024).toFixed(2);
        alert(`📁 A pasta "${file.name}" tem o tamanho total de:\n\n${mb} MB\n(${data.size} bytes)`);
      } else {
        alert('Erro ao calcular tamanho: ' + data.error);
      }
    } catch(e) {
      alert("Erro na requisição.");
    } finally {
      setLoading(false);
    }
  };

  const handleChmod = async (file: FtpFile) => {
    const perm = prompt(`CHMOD Numérico para ${file.name}\n(Ex: 644 para arquivo, 755 para pasta)`, file.isDirectory ? '755' : '644');
    if (!perm?.trim() || !/^[0-7]{3,4}$/.test(perm)) return;
    setLoading(true);
    try {
      const filePath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
      const res = await fetch('/api/ftp/chmod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: client, path: filePath, permissions: perm })
      });
      const data = await res.json();
      if (data.success) {
         alert(`✅ Permissões de "${file.name}" atualizadas para ${perm}`);
      } else {
         alert('Erro ao mudar permissão: ' + data.error);
      }
    } catch(e) {
      alert('Erro de rede ao aplicar CHMOD.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: FtpFile) => {
    if (!confirm(`Certeza que deseja deletar "${file.name}" permanentemente?`)) return;
    setLoading(true);
    try {
      const filePath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
      const res = await fetch('/api/ftp/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: client, path: filePath, isDirectory: file.isDirectory })
      });
      const data = await res.json();
      if (data.success) loadFiles(path);
      else alert('Erro ao excluir: ' + data.error);
    } catch (e) {
      alert('Erro ao conectar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (file: FtpFile) => {
    const newName = prompt('Novo nome ou caminho (relativo ao atual):', file.name);
    if (!newName?.trim() || newName === file.name) return;
    setLoading(true);
    try {
      const fromPath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
      const toPath = path === '/' ? `/${newName}` : `${path}/${newName}`;
      const res = await fetch('/api/ftp/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: client, fromPath, toPath })
      });
      const data = await res.json();
      if (data.success) loadFiles(path);
      else alert('Erro ao renomear: ' + data.error);
    } catch (e) {
      alert('Erro ao conectar.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (file: FtpFile) => {
    if (file.isDirectory) return alert("Cópia de diretórios não é suportada diretamente.");
    const newName = prompt('Criar cópia com qual nome:', `copia_${file.name}`);
    if (!newName?.trim() || newName === file.name) return;
    setLoading(true);
    try {
      const fromPath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
      const toPath = path === '/' ? `/${newName}` : `${path}/${newName}`;
      const res = await fetch('/api/ftp/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: client, fromPath, toPath })
      });
      const data = await res.json();
      if (data.success) loadFiles(path);
      else alert('Erro ao copiar: ' + data.error);
    } catch (e) {
      alert('Erro ao conectar.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Excluir permanentemente ${selectedFiles.size} itens selecionados?`)) return;
    setLoading(true);
    try {
      let errCount = 0;
      for (const fileName of selectedFiles) {
        const file = files.find(f => f.name === fileName);
        if (!file) continue;
        const filePath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
        const res = await fetch('/api/ftp/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentials: client, path: filePath, isDirectory: file.isDirectory })
        });
        const data = await res.json();
        if (!data.success) errCount++;
      }
      if (errCount > 0) alert(`${errCount} falharam ao excluir.`);
    } finally {
      loadFiles(path);
    }
  };

  const handleBulkMove = async () => {
    const destPath = prompt(`Mover ${selectedFiles.size} itens para qual pasta?`, path === '/' ? '/nova_pasta' : `${path}/nova_pasta`);
    if (!destPath?.trim()) return;
    const normalizedDest = destPath.startsWith('/') ? destPath : (path === '/' ? `/${destPath}` : `${path}/${destPath}`);
    setLoading(true);
    try {
      let errCount = 0;
      for (const fileName of selectedFiles) {
        const fromPath = path === '/' ? `/${fileName}` : `${path}/${fileName}`;
        const toPath = normalizedDest.endsWith('/') ? `${normalizedDest}${fileName}` : `${normalizedDest}/${fileName}`;
        const res = await fetch('/api/ftp/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentials: client, fromPath, toPath })
        });
        const data = await res.json();
        if (!data.success) errCount++;
      }
      if (errCount > 0) alert(`${errCount} itens falharam ao mover.`);
    } finally {
      loadFiles(path);
    }
  };

  const handleBulkCopy = async () => {
    const fileNames = Array.from(selectedFiles);
    const hasDirs = fileNames.some(name => files.find(f => f.name === name)?.isDirectory);
    if (hasDirs) return alert("Desmarque as pastas. Cópias suportam apenas arquivos.");
    const suffix = prompt(`Sufixo para os arquivos clonados:`, `_copia`);
    if (!suffix) return;
    setLoading(true);
    try {
      let errCount = 0;
      for (const fileName of selectedFiles) {
        const fromPath = path === '/' ? `/${fileName}` : `${path}/${fileName}`;
        const dotIndex = fileName.lastIndexOf('.');
        const toName = dotIndex > 0 ? fileName.substring(0, dotIndex) + suffix + fileName.substring(dotIndex) : fileName + suffix;
        const toPath = path === '/' ? `/${toName}` : `${path}/${toName}`;
        const res = await fetch('/api/ftp/copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentials: client, fromPath, toPath })
        });
        const data = await res.json();
        if (!data.success) errCount++;
      }
      if (errCount > 0) alert(`${errCount} falharam ao copiar.`);
    } finally {
      loadFiles(path);
    }
  };

  const handleContextAction = (action: 'copy' | 'move' | 'delete' | 'edit' | 'chmod' | 'size') => {
    const file = contextMenu?.file;
    if (!file) return;
    const useBulk = selectedFiles.size > 1 && selectedFiles.has(file.name);
    
    if (action === 'copy') useBulk ? handleBulkCopy() : handleCopy(file);
    else if (action === 'move') useBulk ? handleBulkMove() : handleRename(file);
    else if (action === 'delete') useBulk ? handleBulkDelete() : handleDelete(file);
    else if (action === 'edit') handleOpenFile(file);
    else if (action === 'chmod') handleChmod(file);
    else if (action === 'size') handleCalculateSize(file);
  };

  const handleContextMenu = (e: React.MouseEvent, file: FtpFile) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, file });
    if (!selectedFiles.has(file.name)) setSelectedFiles(new Set([file.name]));
  };

  const handleSaveCode = async (content: string) => {
    setIsSaving(true);
    try {
      const filePath = path === '/' ? `/${editingFile}` : `${path}/${editingFile}`;
      const res = await fetch('/api/ftp/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: client, path: filePath, content })
      });
      const data = await res.json();
      if (data.success) setEditorOpen(false);
      loadFiles(path);
    } finally {
      setIsSaving(false);
    }
  };

  const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { 
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false); 
    }
  };
  
  const processEntry = async (entry: any, currentPath: string, filesToUpload: {file: File, relativePath: string}[]) => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve) => entry.file(resolve));
      filesToUpload.push({ file, relativePath: currentPath + '/' + file.name });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readEntries = () => new Promise<any[]>((resolve) => dirReader.readEntries(resolve));
      let entries = await readEntries();
      let allEntries = [...entries];
      while(entries.length > 0) {
        entries = await readEntries();
        allEntries = [...allEntries, ...entries];
      }
      for (const child of allEntries) {
        await processEntry(child, currentPath + '/' + entry.name, filesToUpload);
      }
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;
    
    const filesToUpload: {file: File, relativePath: string}[] = [];
    const promises = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) promises.push(processEntry(entry, '', filesToUpload));
      }
    }
    await Promise.all(promises);
    
    // Check for duplicates
    const duplicates = filesToUpload.filter(fData => {
      const fileName = fData.relativePath.replace(/^\//, '').split('/')[0];
      return files.some(existing => existing.name === fileName);
    }).map(fData => fData.relativePath.replace(/^\//, ''));

    if (duplicates.length > 0) {
      setPendingUploadData({ filesToUpload, duplicates });
      setShowOverwriteModal(true);
      return;
    }

    startUpload(filesToUpload);
  };

  const startUpload = async (filesToUpload: {file: File, relativePath: string}[]) => {
    // Setup visual tracking
    const newJobs = filesToUpload.map(fData => ({
      id: Math.random().toString(),
      name: fData.relativePath.replace(/^\//, ''),
      status: 'pending' as const,
      progress: 0
    }));
    
    setUploads(prev => [...prev, ...newJobs]);

    // Sequential Upload with XHR tracking
    for (let i = 0; i < filesToUpload.length; i++) {
        const fileData = filesToUpload[i];
        const job = newJobs[i];
        
        setUploads(prev => prev.map(u => u.id === job.id ? { ...u, status: 'uploading' } : u));
        await uploadFileWithProgress(fileData.file, fileData.relativePath, job.id);
    }
    
    loadFiles(path);
  };

  const handleConfirmOverwrite = () => {
    if (pendingUploadData) {
      startUpload(pendingUploadData.filesToUpload);
    }
    setShowOverwriteModal(false);
    setPendingUploadData(null);
  };

  const handleCancelOverwrite = () => {
    setShowOverwriteModal(false);
    setPendingUploadData(null);
  };

  const uploadFileWithProgress = (file: File, relativePath: string, jobId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const finalRelativePath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
      const filePath = path === '/' ? finalRelativePath : `${path}${finalRelativePath}`;
      
      const formData = new FormData();
      formData.append('credentials', JSON.stringify(client));
      formData.append('path', filePath);
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/ftp/upload', true);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const p = Math.round((e.loaded / e.total) * 90); // cap at 90 till save
          setUploads(prev => prev.map(u => u.id === jobId ? { ...u, progress: p } : u));
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success) {
              setUploads(prev => prev.map(u => u.id === jobId ? { ...u, status: 'success', progress: 100 } : u));
              resolve(true);
              return;
            }
          } catch(e) {}
        }
        setUploads(prev => prev.map(u => u.id === jobId ? { ...u, status: 'error', progress: 100 } : u));
        resolve(false);
      };
      
      xhr.onerror = () => {
        setUploads(prev => prev.map(u => u.id === jobId ? { ...u, status: 'error', progress: 100 } : u));
        resolve(false);
      };
      
      xhr.send(formData);
    });
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }} onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      
      {/* Search and Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, backgroundColor: 'var(--bg-surface)', padding: '12px 20px', borderRadius: 8, border: '1px solid var(--border-color)', gap: 10, flexWrap: 'wrap' }}>
        <HardDrive size={18} color="var(--color-primary)" />
        <span style={{ color: 'var(--text-muted)' }}>Caminho:</span>
        <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-main)', padding: '6px 10px', borderRadius: 4, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-inverse)', border: '1px solid var(--border-color)' }}>
          {path}
        </span>
        
        <div style={{ position: 'relative', width: 220 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar arquivo..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ width: '100%', padding: '8px 14px 8px 34px', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none' }} 
          />
        </div>

        {path !== '/' && (
          <button onClick={handleNavigateUp} className="dark-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, fontSize: '0.9rem', fontWeight: 500 }}>
            <ArrowUpCircle size={16} /> Subir
          </button>
        )}
        <button onClick={handleCreateFolder} className="dark-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, fontSize: '0.9rem', fontWeight: 500 }}>
          <FolderPlus size={16} /> Nova Pasta
        </button>
        <button onClick={() => loadFiles(path)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 6, fontSize: '0.9rem', fontWeight: 500, border: 'none' }}>
          <Loader2 size={16} className={loading && files.length > 0 ? "spin" : ""} /> Atualizar
        </button>
      </div>

      {selectedFiles.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15, backgroundColor: 'rgba(45, 79, 244, 0.1)', padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(45, 79, 244, 0.3)', gap: 15, animation: 'fadeIn 0.2s' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedFiles.size} selecionados</span>
          <div style={{ flex: 1 }}></div>
          <button onClick={handleBulkCopy} className="bulk-btn">
            <Copy size={14} /> Copiar
          </button>
          <button onClick={handleBulkMove} className="bulk-btn">
            <Scissors size={14} /> Mover
          </button>
          <button onClick={handleBulkDelete} className="bulk-btn-danger">
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}

      {loading && files.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={36} className="spin" style={{ marginBottom: 15, color: 'var(--color-primary)' }} /> 
          <p>Lendo diretório remoto...</p>
        </div>
      ) : error ? (
        <div style={{ padding: 20, backgroundColor: 'rgba(230, 93, 41, 0.1)', color: 'var(--color-alert)', borderRadius: 8, border: '1px solid rgba(230, 93, 41, 0.3)' }}>
          <strong>Falha na conexão:</strong> {error}
        </div>
      ) : (
        <div style={{ flex: 1, backgroundColor: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-color)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-sidebar)', boxShadow: '0 1px 0 var(--border-color)', zIndex: 10 }}>
              <tr>
                <th style={{ width: 40, padding: '14px 20px', textAlign: 'center' }}>
                  <input type="checkbox" checked={filteredFiles.length > 0 && selectedFiles.size === filteredFiles.length} onChange={(e) => { e.target.checked ? setSelectedFiles(new Set(filteredFiles.map(f => f.name))) : setSelectedFiles(new Set()); }} style={{ cursor: 'pointer' }} />
                </th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Nome</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.95rem', width: '15%' }}>Tamanho</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.95rem', width: '20%' }}>Modificação</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.95rem', width: '140px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}><Folder size={48} color="var(--border-color)" style={{ margin: '0 auto 10px', display: 'block' }} />Nenhum arquivo encontrado.</td></tr>
              ) : (
                (() => {
                  const rows: React.ReactNode[] = [];
                  
                  const renderRows = (fileList: FtpFile[], currentPath: string, level: number = 0) => {
                    fileList.forEach(file => {
                      const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
                      const isExpanded = expandedPaths.has(fullPath);
                      const isExpanding = expandingFolders.has(fullPath);
                      const isSelected = selectedFiles.has(file.name); // Note: multi-select might need adjustment for recursive paths, but keeping it simple for now

                      rows.push(
                        <tr 
                          key={fullPath} 
                          onContextMenu={(e) => handleContextMenu(e, file)} 
                          onClick={() => file.isDirectory ? handleNavigate(file.name) : handleOpenFile(file)} 
                          style={{ 
                            borderBottom: '1px solid var(--border-color)', 
                            backgroundColor: isSelected ? 'rgba(45, 79, 244, 0.15)' : 'transparent', 
                            cursor: 'pointer' 
                          }} 
                          className="file-row"
                        >
                          <td style={{ padding: '14px 20px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                             <input type="checkbox" checked={isSelected} onChange={(e) => { const newSet = new Set(selectedFiles); e.target.checked ? newSet.add(file.name) : newSet.delete(file.name); setSelectedFiles(newSet); }} style={{ cursor: 'pointer' }} />
                          </td>
                          <td style={{ padding: `14px 20px 14px ${20 + (level * 25)}px`, display: 'flex', alignItems: 'center', gap: 12, userSelect: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', minWidth: 24 }}>
                              {file.isDirectory && (
                                <button 
                                  onClick={(e) => toggleExpand(e, file, currentPath)} 
                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                                >
                                  {isExpanding ? <Loader2 size={14} className="spin" /> : <Edit3 size={14} style={{ opacity: 0 }} /> /* placeholder for chevron if we use icons */}
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', marginRight: -4 }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                              )}
                            </div>
                            {file.isDirectory ? <Folder size={22} color="var(--color-primary)" /> : <FileText size={22} color="var(--text-muted)" />}
                            <span style={{ fontWeight: file.isDirectory ? 600 : 400, color: file.isDirectory ? 'var(--text-inverse)' : 'var(--text-primary)' }}>{file.name}</span>
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{file.isDirectory ? '--' : file.size < 1024 ? `${file.size} B` : (file.size / 1024).toFixed(1) + ' KB'}</td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(file.modifiedAt || Date.now()).toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                              <button onClick={(e) => { e.stopPropagation(); handleCopy(file); }} className="btn-icon" title="Copiar / Duplicar"><Copy size={18} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleRename(file); }} className="btn-icon-primary" title="Mover / Renomear"><Edit3 size={18} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(file); }} className="btn-icon-danger" title="Excluir"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      );

                      if (isExpanded && folderContents.has(fullPath)) {
                        renderRows(folderContents.get(fullPath)!, fullPath, level + 1);
                      }
                    });
                  };

                  renderRows(filteredFiles, path);
                  return rows;
                })()
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Upload Progress Box */}
      {uploads.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 30, right: 30, width: 350,
          backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
          borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 5000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }} className="fade-in">
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-inverse)', fontWeight: 600 }}>
              Transferências ({uploads.filter(u => u.status === 'success' || u.status === 'error').length}/{uploads.length})
            </h4>
            <button onClick={() => setUploads([])} style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', border: 'none' }} title="Fechar/Limpar Progresso"><X size={16}/></button>
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto', padding: '15px 15px 5px' }}>
             {uploads.map(job => (
               <div key={job.id} style={{ marginBottom: 15 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                   <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 220, fontWeight: 500 }}>{job.name}</span>
                   <span style={{ color: job.status === 'error' ? 'var(--color-alert)' : job.status === 'success' ? '#10b981' : 'var(--text-muted)' }}>
                      {job.status === 'pending' ? 'Na fila...' : job.status === 'error' ? 'Falha' : `${job.progress}%`}
                   </span>
                 </div>
                 <div style={{ width: '100%', height: 6, backgroundColor: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                   <div style={{ width: `${job.progress}%`, height: '100%', backgroundColor: job.status === 'error' ? 'var(--color-alert)' : job.status === 'success' ? '#10b981' : 'var(--color-primary)', transition: 'width 0.3s ease-out' }}></div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {isDragging && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '2px dashed var(--color-primary)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, pointerEvents: 'none' }}>
          <UploadCloud size={72} color="var(--color-primary)" style={{ marginBottom: 20 }} />
          <h2 style={{ color: 'var(--color-primary)', fontSize: '1.5rem', fontWeight: 600 }}>Solte para enviar</h2>
        </div>
      )}

      {contextMenu && contextMenu.visible && contextMenu.file && (
        <div style={{ position: 'absolute', top: contextMenu.y - 120, left: contextMenu.x - 280, backgroundColor: 'var(--bg-sidebar)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', borderRadius: 8, padding: '8px 0', zIndex: 200, minWidth: 200, border: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
          <div className="ctx-item" onClick={() => handleContextAction('edit')}><Edit3 size={16} /> Abrir / Editar / Visualizar</div>
          <div className="ctx-item" onClick={() => handleContextAction('chmod')}><Lock size={16} /> Alterar Permissões</div>
          {contextMenu.file.isDirectory && (
            <div className="ctx-item" onClick={() => handleContextAction('size')}><Calculator size={16} /> Calcular Tamanho (Ocupado)</div>
          )}
          <div style={{ margin: '4px 0', height: 1, backgroundColor: 'var(--border-color)' }}></div>
          <div className="ctx-item" onClick={() => handleContextAction('copy')}><Copy size={16} /> {selectedFiles.size > 1 && selectedFiles.has(contextMenu.file.name) ? `Copiar (${selectedFiles.size})` : 'Copiar Arquivo'}</div>
          <div className="ctx-item" onClick={() => handleContextAction('move')}><Scissors size={16} /> {selectedFiles.size > 1 && selectedFiles.has(contextMenu.file.name) ? `Mover (${selectedFiles.size})` : 'Mover / Renomear'}</div>
          <div style={{ margin: '4px 0', height: 1, backgroundColor: 'var(--border-color)' }}></div>
          <div className="ctx-item danger" onClick={() => handleContextAction('delete')}><Trash2 size={16} /> {selectedFiles.size > 1 && selectedFiles.has(contextMenu.file.name) ? `Excluir (${selectedFiles.size})` : 'Excluir Item'}</div>
        </div>
      )}

      {/* Overwrite Confirmation Modal */}
      {showOverwriteModal && pendingUploadData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, width: '100%', maxWidth: 500, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'scaleUp 0.3s ease-out' }}>
            <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{ backgroundColor: 'rgba(230, 93, 41, 0.1)', color: 'var(--color-alert)', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UploadCloud size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-inverse)', fontWeight: 700 }}>Confirmar Sobrescrita</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Alguns arquivos já existem nesta pasta.</p>
              </div>
            </div>
            
            <div style={{ padding: '20px 30px', maxHeight: 300, overflowY: 'auto' }}>
              <p style={{ margin: '0 0 15px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Deseja substituir os arquivos existentes por estes novos arquivos enviando agora?
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {pendingUploadData.duplicates.slice(0, 5).map(name => (
                  <li key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--bg-main)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Box size={14} /> {name}
                  </li>
                ))}
                {pendingUploadData.duplicates.length > 5 && (
                  <li style={{ padding: '10px 0', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    + {pendingUploadData.duplicates.length - 5} outros arquivos...
                  </li>
                )}
              </ul>
            </div>

            <div style={{ padding: '20px 30px', backgroundColor: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={handleCancelOverwrite} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>
                Cancelar envio
              </button>
              <button onClick={handleConfirmOverwrite} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(45, 79, 244, 0.3)' }}>
                Substituir Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      <CodeEditorModal isOpen={editorOpen} onClose={() => setEditorOpen(false)} fileName={editingFile} initialContent={editingContent} onSave={handleSaveCode} isSaving={isSaving} />
      {imageViewData && (
        <ImageViewerModal isOpen={imageViewOpen} onClose={() => setImageViewOpen(false)} fileName={imageViewData.name} base64Data={imageViewData.b64} loading={false} />
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .file-row:hover { background-color: var(--bg-surface-hover) !important; }
        .dark-btn { background-color: var(--bg-main); color: var(--text-inverse); border: 1px solid var(--border-color); cursor: pointer; }
        .dark-btn:hover { background-color: var(--border-color); }
        .bulk-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background-color: transparent; border: 1px solid rgba(45, 79, 244, 0.4); color: var(--color-primary); border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
        .bulk-btn:hover { background-color: rgba(45, 79, 244, 0.2); }
        .bulk-btn-danger { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background-color: rgba(230, 93, 41, 0.1); border: 1px solid rgba(230, 93, 41, 0.4); color: var(--color-alert); border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
        .bulk-btn-danger:hover { background-color: rgba(230, 93, 41, 0.2); }
        .btn-icon { color: var(--text-muted); background: transparent; cursor: pointer; padding: 6px; border-radius: 4px; transition: 0.2s; border: none; }
        .btn-icon:hover { background-color: rgba(200, 200, 200, 0.15); color: var(--text-inverse); }
        .btn-icon-primary { color: var(--color-primary); background: transparent; cursor: pointer; padding: 6px; border-radius: 4px; transition: 0.2s; border: none; }
        .btn-icon-primary:hover { background-color: rgba(45, 79, 244, 0.15); }
        .btn-icon-danger { color: var(--color-alert); background: transparent; cursor: pointer; padding: 6px; border-radius: 4px; transition: 0.2s; border: none; }
        .btn-icon-danger:hover { background-color: rgba(230, 93, 41, 0.15); }
        .ctx-item { padding: 10px 20px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: var(--text-primary); transition: background-color 0.2s; }
        .ctx-item:hover { background-color: var(--bg-main); color: var(--text-inverse); }
        .ctx-item.danger { color: var(--color-alert); }
        .ctx-item.danger:hover { background-color: rgba(230, 93, 41, 0.1); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}} />
    </div>
  );
}
