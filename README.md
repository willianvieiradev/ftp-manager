# WFTP — FTP Server Manager

Gerenciador de arquivos via FTP com interface web moderna. Conecte-se a múltiplos servidores FTP, explore diretórios, edite arquivos de código no navegador, faça upload/download e muito mais.

## Funcionalidades

- **Gerenciamento de servidores**: cadastre, edite e exclua conexões FTP (dados salvos localmente no navegador).
- **Explorador de arquivos**: navegação por diretórios com ícones, tamanhos e datas.
- **Editor de código**: edite arquivos diretamente no navegador com syntax highlight (Monaco Editor).
- **Operações de arquivo**: upload, download, copiar, renomear, excluir, criar pastas e alterar permissões (chmod).
- **Visualizador de imagens**: pré-visualização de imagens sem baixar.
- **Importar/Exportar**: faça backup das suas conexões em JSON.
- **Tema claro/escuro**.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [basic-ftp](https://www.npmjs.com/package/basic-ftp) — cliente FTP/FTPS no servidor
- [Monaco Editor](https://www.npmjs.com/package/@monaco-editor/react)
- [lucide-react](https://www.npmjs.com/package/lucide-react) — ícones

## Como rodar

```bash
# instalar dependências
npm install

# ambiente de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000), clique em **Cadastrar Servidor** e informe host, usuário, porta e senha.

### Build de produção

```bash
npm run build
npm start
```

## Estrutura

```
src/
├── app/
│   ├── api/ftp/        # rotas de API (list, upload, download, delete, rename, ...)
│   └── page.tsx        # dashboard com lista de servidores
├── components/         # FileExplorer, ClientManagerModal, CodeEditorModal, ImageViewerModal
└── lib/                # cliente FTP e tipos
```

## Notas de segurança

As credenciais dos servidores ficam apenas no `localStorage` do seu navegador e nunca saem dele, exceto nas requisições às rotas de API locais. Não exponha esta aplicação publicamente sem camada de autenticação.
