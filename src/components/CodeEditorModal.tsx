import React, { useRef } from "react";
import Editor from "@monaco-editor/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  fileName: string;
  initialContent: string;
  isSaving: boolean;
}

export default function CodeEditorModal({ isOpen, onClose, onSave, fileName, initialContent, isSaving }: Props) {
  const editorRef = useRef<any>(null);

  if (!isOpen) return null;

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
  };

  const handleSave = () => {
    if (editorRef.current) {
      onSave(editorRef.current.getValue());
    }
  };

  const getLanguage = () => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx': return 'javascript';
      case 'ts':
      case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'php': return 'php';
      case 'py': return 'python';
      default: return 'plaintext';
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} className="fade-in">
      <div style={{ backgroundColor: 'var(--color-dark)', width: '90%', height: '90%', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        
        <div style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', color: 'white', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <h3 style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>{fileName}</h3>
            {isSaving && <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>Salvando no servidor...</span>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} disabled={isSaving} style={{ padding: '8px 20px', borderRadius: 4, background: '#333', color: 'white', opacity: isSaving ? 0.5 : 1 }}>Fechar</button>
            <button onClick={handleSave} disabled={isSaving} style={{ padding: '8px 20px', borderRadius: 4, background: 'var(--color-primary)', color: 'white', fontWeight: 600, opacity: isSaving ? 0.5 : 1 }}>
              {isSaving ? 'Aguarde...' : 'Salvar Arquivo'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
          <Editor
            height="100%"
            theme="vs-dark"
            language={getLanguage()}
            defaultValue={initialContent}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', 'Monaco', monospace",
              wordWrap: 'on',
              padding: { top: 16 }
            }}
          />
        </div>
        
      </div>
    </div>
  );
}
