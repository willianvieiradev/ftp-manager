import React from "react";
import { Loader2, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  base64Data: string;
  loading: boolean;
}

export default function ImageViewerModal({ isOpen, onClose, fileName, base64Data, loading }: Props) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, backdropFilter: 'blur(3px)' }} className="fade-in">
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 30, background: 'rgba(255,255,255,0.1)', color: 'white', padding: 10, borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
        <X size={24} />
      </button>
      
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: 600, marginBottom: 20, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{fileName}</div>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ccc', marginTop: 40, padding: 40, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 }}>
            <Loader2 size={48} className="spin" style={{ marginBottom: 20, color: 'var(--color-primary)' }} /> 
            <p>Carregando imagem do servidor...</p>
          </div>
        ) : (
          <img src={base64Data} alt={fileName} style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 100px)', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
        )}
      </div>
    </div>
  );
}
