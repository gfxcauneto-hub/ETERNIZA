# Eterniza Amor

Aplicação React com backend Node.js para criação e consulta de cobranças Pix pela Efí. O navegador nunca recebe o `Client_Secret` nem o certificado P12. Todas as imagens e vídeos necessários estão incluídos em `client/public/assets`.

## Requisitos

| Item | Versão ou configuração |
| --- | --- |
| Node.js | 22 ou superior |
| Gerenciador | pnpm 10.4.1 |
| Certificado Efí | P12 de produção, convertido para Base64 |
| HTTPS | Obrigatório em produção |

## Configuração local

Copie `.env.example` para `.env` e preencha os segredos conforme a documentação de credenciais da Efí.[2] O certificado deste projeto foi validado com **senha vazia**, portanto o backend força uma passphrase vazia.

```bash
cp .env.example .env
base64 -w 0 producao.p12
pnpm install
pnpm dev
```

No macOS, gere o Base64 sem quebras com:

```bash
base64 < producao.p12 | tr -d '\n'
```

Use o resultado em `EFI_P12_BASE64`. Se a plataforma limitar o tamanho de cada variável, divida a sequência em três partes contíguas e use `EFI_P12_PART_A`, `EFI_P12_PART_B` e `EFI_P12_PART_C`.

## Publicação no GitHub

Crie um repositório vazio no GitHub e execute os comandos abaixo dentro desta pasta:

```bash
git init
git add .
git commit -m "Deploy inicial Eterniza Amor"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

O `.gitignore` bloqueia arquivos `.env`, certificados, chaves privadas, dependências e builds. **Nunca faça commit do P12, Client Secret ou Base64 do certificado.** Por segurança, gere ou rotacione as credenciais de produção antes de abrir o repositório para terceiros.

## Deploy recomendado no Render

O repositório inclui `Dockerfile` e `render.yaml`. No Render, crie um **Blueprint** a partir do repositório ou um **Web Service** com runtime Docker. Depois, cadastre as variáveis abaixo em *Environment*:

| Variável | Conteúdo |
| --- | --- |
| `EFI_ENVIRONMENT` | `production` |
| `EFI_CLIENT_ID` | Client ID da aplicação Efí |
| `EFI_CLIENT_SECRET` | Client Secret da aplicação Efí |
| `EFI_PIX_KEY` | Chave Pix recebedora |
| `EFI_P12_BASE64` | P12 convertido para Base64, sem quebras |

O endpoint de saúde é `/api/health`. O serviço deve responder em HTTPS. Os cinco valores aceitos pelo backend são **R$ 12,90, R$ 14,97, R$ 19,90, R$ 24,90 e R$ 27,96**.

## Validação antes do deploy

```bash
pnpm test
pnpm check
pnpm build
pnpm start
```

Os testes do repositório não criam cobranças reais. Eles verificam tickets, origem das requisições e identificadores de transação. Para validar credenciais Efí, faça a autenticação OAuth2 mTLS em um ambiente privado antes de liberar o domínio.

## Segurança e operação

A API aplica validação de entrada, proteção de origem, rate limit por IP, respostas sem cache e consulta do pagamento pelo `txid`. Arquivos versionados usam cache longo e as respostas são comprimidas. A confirmação funciona por consulta periódica enquanto o checkout está aberto. Para conciliação confiável após o cliente fechar a página, configure posteriormente o webhook Efí em infraestrutura que aceite autenticação mTLS conforme a documentação oficial.[1]

## Referências

[1]: https://dev.efipay.com.br/docs/api-pix/webhooks/ "Efí — Webhooks da API Pix"
[2]: https://dev.efipay.com.br/docs/api-pix/credenciais/ "Efí — Credenciais da API Pix"
