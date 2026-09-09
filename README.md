# Eterniza Amor — projeto completo

Este pacote contém o **frontend React completo**, o **backend Node.js**, as **vinte mídias locais**, a integração Pix Efí, testes, Docker, GitHub Actions e configuração para Render.

> Não abra `client/index.html` diretamente. React e a API Pix exigem que o projeto seja iniciado pelo servidor Node.

## Executar localmente

Instale Node.js 22. No Windows, execute `INICIAR-WINDOWS.bat`. No macOS ou Linux, execute:

```bash
sh INICIAR-MAC-LINUX.sh
```

Depois acesse `http://localhost:3000`.

## Configurar o Pix

Copie `.env.example` para `.env` e preencha as variáveis conforme a documentação da Efí.[1] O certificado deve ser convertido para Base64, sem quebras de linha. O P12 usado neste projeto foi validado com senha vazia. As credenciais reais e o certificado não acompanham o ZIP por segurança. A confirmação por webhook exige infraestrutura compatível com mTLS.[2]

| Variável | Finalidade |
| --- | --- |
| `EFI_ENVIRONMENT` | Use `production` em produção |
| `EFI_CLIENT_ID` | Client ID Efí |
| `EFI_CLIENT_SECRET` | Client Secret Efí |
| `EFI_PIX_KEY` | Chave Pix recebedora |
| `EFI_P12_BASE64` | Certificado P12 em Base64 |

## Validar e compilar

```bash
npx pnpm@10.4.1 install
npx pnpm@10.4.1 test
npx pnpm@10.4.1 check
npx pnpm@10.4.1 build
npx pnpm@10.4.1 start
```

A pasta `dist` contém o build gerado. O frontend está em `dist/public` e o servidor compilado em `dist/index.js`.

## Publicar pelo GitHub

Envie todos os arquivos desta pasta ao repositório. Não envie `.env`, P12, PEM, Client Secret nem outros certificados. O `.gitignore` já bloqueia esses arquivos. No Render, importe o repositório como **Blueprint** usando `render.yaml` ou crie um **Web Service Docker** usando o `Dockerfile`. Cadastre os segredos no painel da hospedagem.

GitHub Pages serve somente arquivos estáticos e não executa o backend Pix. Para o checkout real, use Render, Railway, Fly.io, VPS ou outro serviço que execute Node/Docker.

## Conteúdo incluído

| Componente | Local |
| --- | --- |
| Página e funil completos | `client/src/pages/Home.tsx` |
| Estilos e animações | `client/src/index.css` |
| Imagens, vídeos e ícones | `client/public/assets` |
| Backend seguro Pix | `server/efiPix.ts` e `server/pixRoutes.ts` |
| Servidor de produção | `server/index.ts` |
| Testes | `server/*.test.ts` |
| Deploy | `Dockerfile`, `render.yaml`, `.github/workflows/ci.yml` |

## Referências

[1]: https://dev.efipay.com.br/docs/api-pix/credenciais/ "Efí — Credenciais da API Pix"
[2]: https://dev.efipay.com.br/docs/api-pix/webhooks/ "Efí — Webhooks da API Pix"
