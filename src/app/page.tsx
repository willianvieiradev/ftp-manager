"use client";
import React, { useState, useEffect, useRef } from "react";
import { ClientProfile } from "@/lib/types";
import ClientManagerModal from "@/components/ClientManagerModal";
import FileExplorer from "@/components/FileExplorer";
import { PlusCircle, Server, Settings, Sun, Moon, Box, Download, Upload, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [activeClient, setActiveClient] = useState<ClientProfile | null>(null);
  
  const [managerOpen, setManagerOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const APP_NAME = "WFTP";

  useEffect(() => {
    const savedClients = localStorage.getItem("ftp_clients");
    if (savedClients) {
      const parsed = JSON.parse(savedClients);
      const sorted = parsed.sort((a: ClientProfile, b: ClientProfile) => a.name.localeCompare(b.name, 'pt-BR'));
      setClients(sorted);
      if (sorted.length > 0) setActiveClient(sorted[0]);
    }
    
    const savedTheme = localStorage.getItem("ftp_theme") as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem("ftp_theme", newTheme);
  };

  const saveClients = (newClients: ClientProfile[]) => {
    const sorted = [...newClients].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    setClients(sorted);
    localStorage.setItem("ftp_clients", JSON.stringify(sorted));
  };

  const handleSaveClient = (client: ClientProfile) => {
    const exists = clients.find(c => c.id === client.id);
    let updated;
    if (exists) {
      updated = clients.map(c => c.id === client.id ? client : c);
    } else {
      updated = [...clients, client];
    }
    saveClients(updated);
    setActiveClient(client);
  };

  const handleDeleteClient = (client: ClientProfile) => {
    if (!confirm(`Excluir o servidor "${client.name}"? Esta ação não pode ser desfeita.`)) return;
    const updated = clients.filter(c => c.id !== client.id);
    saveClients(updated);
    if (activeClient?.id === client.id) {
      setActiveClient(updated[0] || null);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(clients, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ftp-connections.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedClients = JSON.parse(content) as ClientProfile[];
        
        if (Array.isArray(importedClients) && importedClients.every(c => c.id && c.name && c.host)) {
          const newClients = [...clients];
          importedClients.forEach(importedClient => {
            const index = newClients.findIndex(c => c.id === importedClient.id);
            if (index >= 0) {
              newClients[index] = importedClient;
            } else {
              newClients.push(importedClient);
            }
          });
          saveClients(newClients);
          alert('Conexões importadas com sucesso!');
        } else {
          alert('Formato de arquivo inválido. Verifique se é um backup válido do sistema.');
        }
      } catch (err) {
        alert('Erro ao ler ou processar o arquivo.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main style={{ display: 'flex', width: '100%', height: '100%' }} data-theme={theme !== 'dark' ? 'light' : undefined}>
      {/* Sidebar */}
      <aside style={{ width: 320, backgroundColor: 'var(--bg-sidebar)', padding: '30px 24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40, paddingLeft: 10 }}>
          <div style={{ width: 44, height: 44, backgroundColor: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E1E1E' }}>
            <Box size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-inverse)', letterSpacing: 1 }}>{APP_NAME}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase' }}>Server Manager</span>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15, fontWeight: 700 }}>Meus Servidores</h3>
          {clients.length === 0 ? (
            <div style={{ padding: '20px 15px', backgroundColor: 'var(--bg-surface)', borderRadius: 8, fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', border: '1px dashed var(--border-color)', marginTop: 10 }}>
              Nenhum servidor configurado.<br/>Adicione o seu primeiro!
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {clients.map(client => (
                <li 
                  key={client.id}
                  onClick={() => setActiveClient(client)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: 8,
                    backgroundColor: activeClient?.id === client.id ? 'var(--color-primary)' : 'var(--bg-surface)',
                    color: activeClient?.id === client.id ? 'white' : 'var(--text-primary)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: '1px solid',
                    borderColor: activeClient?.id === client.id ? 'var(--color-primary)' : 'var(--border-color)',
                  }}
                >
                  <Server size={18} opacity={activeClient?.id === client.id ? 1 : 0.6} />
                  <span style={{ flex: 1, fontWeight: activeClient?.id === client.id ? 600 : 400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{client.name}</span>
                  <Settings 
                    size={16} 
                    style={{ opacity: 0.4, cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onClick={(e) => { e.stopPropagation(); setClientToEdit(client); setManagerOpen(true); }}
                    onMouseOver={e => e.currentTarget.style.opacity = '1'}
                    onMouseOut={e => e.currentTarget.style.opacity = '0.4'}
                  />
                  <Trash2 
                    size={16} 
                    style={{ opacity: 0.4, cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteClient(client); }}
                    onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseOut={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'inherit'; }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button 
            onClick={() => { setClientToEdit(null); setManagerOpen(true); }}
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-inverse)', padding: '14px', borderRadius: 8, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: '1px solid var(--border-color)', transition: 'all 0.2s ease', cursor: 'pointer' }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
          >
            <PlusCircle size={20} /> Cadastrar Servidor
          </button>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={handleExport}
              style={{ flex: 1, backgroundColor: 'transparent', color: 'var(--text-primary)', padding: '10px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid var(--border-color)', transition: 'all 0.2s ease', cursor: 'pointer' }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="Exportar conexões"
            >
              <Download size={16} /> Exportar
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ flex: 1, backgroundColor: 'transparent', color: 'var(--text-primary)', padding: '10px', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid var(--border-color)', transition: 'all 0.2s ease', cursor: 'pointer' }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="Importar conexões"
            >
              <Upload size={16} /> Importar
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleImport} 
            />
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <section style={{ flex: 1, backgroundColor: 'var(--bg-main)', padding: '30px 40px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!activeClient ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Server size={80} color="var(--border-color)" strokeWidth={1} style={{ marginBottom: 20 }} />
            <h2 style={{ fontWeight: 500, fontSize: '1.8rem', color: 'var(--text-inverse)' }}>Nenhum Servidor Selecionado</h2>
            <p style={{ marginTop: 10, fontSize: '1.1rem' }}>Crie ou selecione um cliente na barra lateral para acessar seus arquivos.</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <header style={{ marginBottom: 25, paddingBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-inverse)', marginBottom: 8, letterSpacing: '-0.5px' }}>{activeClient.name}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
                  Autenticado em <strong style={{ color: 'var(--text-primary)' }}>{activeClient.host}</strong> como <strong style={{ color: 'var(--text-primary)' }}>{activeClient.user}</strong>
                </p>
              </div>
              
              <button 
                onClick={toggleTheme} 
                style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
                title={`Mudar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </header>
            
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <FileExplorer client={activeClient} />
            </div>
          </div>
        )}
      </section>

      <ClientManagerModal isOpen={managerOpen} onClose={() => setManagerOpen(false)} onSave={handleSaveClient} clientToEdit={clientToEdit} />
    </main>
  );
}
