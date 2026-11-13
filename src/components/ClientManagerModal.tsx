import React, { useState, useEffect } from "react";
import { ClientProfile } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: ClientProfile) => void;
  clientToEdit?: ClientProfile | null;
}

export default function ClientManagerModal({ isOpen, onClose, onSave, clientToEdit }: Props) {
  const [formData, setFormData] = useState<Partial<ClientProfile>>({ port: 21, secure: false });

  useEffect(() => {
    if (clientToEdit) {
      setFormData(clientToEdit);
    } else {
      setFormData({ port: 21, secure: false, name: "", host: "", user: "", password: "" });
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.host || !formData.user) return;
    
    onSave({
      id: formData.id || Date.now().toString(),
      name: formData.name,
      host: formData.host,
      user: formData.user,
      password: formData.password || "",
      port: Number(formData.port),
      secure: formData.secure
    });
    onClose();
  };

  const inputStyle = { width: '100%', padding: '12px', borderRadius: 6, border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} className="fade-in">
      <div style={{ backgroundColor: 'var(--bg-surface)', padding: 30, borderRadius: 12, width: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ marginBottom: 20, color: 'var(--text-inverse)' }}>{clientToEdit ? 'Editar Cliente' : 'Novo Cliente FTP'}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Nome de Identificação</label>
            <input required type="text" placeholder="Ex: Revenda 01" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Host / IP do Servidor</label>
            <input required type="text" placeholder="ftp.exemplo.com.br" value={formData.host || ''} onChange={e => setFormData({...formData, host: e.target.value})} style={inputStyle} />
          </div>
          
          <div style={{ display: 'flex', gap: 15 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 5, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Usuário</label>
              <input required type="text" placeholder="admin" value={formData.user || ''} onChange={e => setFormData({...formData, user: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ width: 80 }}>
              <label style={{ display: 'block', marginBottom: 5, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Porta</label>
              <input type="number" value={formData.port || 21} onChange={e => setFormData({...formData, port: Number(e.target.value)})} style={inputStyle} />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Senha</label>
            <input type="password" placeholder="Sua senha FTP" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', marginTop: 5, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={formData.secure || false} onChange={e => setFormData({...formData, secure: e.target.checked})} style={{ width: 16, height: 16 }} />
            Conexão Segura (FTPS)
          </label>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 15 }}>
            <button type="button" onClick={onClose} style={{ padding: '12px 20px', borderRadius: 6, background: '#333', color: 'white', fontWeight: 500 }}>Cancelar</button>
            <button type="submit" style={{ padding: '12px 20px', borderRadius: 6, background: 'var(--color-primary)', color: 'white', fontWeight: 600 }}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
