# IPTV Manager

Crie uma aplicação web completa idêntica ao design fornecido (MAC Manager / Ativação IPTV), utilizando a conexão já configurada do Supabase no projeto:

---

### 1. DESIGN E TEMA VISUAL (IDÊNTICO ÀS IMAGENS)
- Fundo: Dark mode preto absoluto (#09090b / bg-black).
- Cards e Containers: Preto grafite escuro com cantos arredondados (rounded-2xl / bg-zinc-900/60 com bordas sutis border-zinc-800).
- Acentos e Destaques: Vermelho escuro/carmesim (bg-red-700 ou #8B0000) usado nos botões primários ("+ Novo dispositivo", "Salvar", abas ativas e pílula do logo).
- Tipografia: Texto branco para títulos, cinza claro (text-zinc-400) para subtítulos e descrições.
- Header Superior: 
  * Ícone vermelho arredondado com sinal de transmissão (Radio icon) e textos "MAC Manager" e "Ativação IPTV".
  * Abas no topo em formato de cápsula: Dashboard e Dispositivos (e Revendedores quando autorizado).
  * Botão de logout simples ("Sair").

---

### 2. CONTROLE DE ACESSO E PERFIS (REGRAS AUTOMÁTICAS)

- Tela de Login: Autenticação fechada via e-mail e senha (sem auto-cadastro).
- **Master Admin Automático (retaseu080@gmail.com):**
  * Configure uma regra automática no código/banco: se o e-mail do usuário logado for retaseu080@gmail.com, force a role como master / admin com permissão total em todas as telas, independentemente de qualquer valor padrão da tabela de perfis.
  * O Master Admin tem poder absoluto: visualiza todos os MACs cadastrados no sistema, gerencia revendedores e define quem tem permissão para cadastrar outros operadoresRevendedores (Criados pelo Admin):):**
  * Têm acesso apenas aos MACs que eles mesmos cadastraram (user_id = auth.uid()).
  * Se o Master ativar o tog"Pode criar revendedores"s"** (can_create_resellers: true), o revendedor passa a ver a aba "Revendedores" e pode criar contas de acesso (usuário e senha) para outros parceiros dele.
  * Se o toggle estiver desligado, ele vê apenas as aDashboardrd*Dispositivosos**.

---

### 3. TELAS DO PAINEL
Dashboard:d:**
   - 4 Cards verticais com bordas arredondadas e ícones discretos à direita:
   Total de Dispositivosos** (ícone de TV Box / Hard Drive)
   Ativosos** (ícone de Check verde)
   Inativosos** (ícone de X cinza)
   Expiradosos** (ícone de Relógio laranja)
   - Bloco infer"Últimos cadastros"s"** com link "Ver todos ->":
     * Tabela simples listando MAC, Usuário, Badge de Status (Verde "Ativo" / Cinza "Inativo") e Validade.
Dispositivos:s:**
   - Título "Dispositivos" e subtítulo "Gerencie ativações por MAC address e credenciais Xtream."
   - Botão vermelho destac"+ Novo dispositivo"o"**.
   - Campo de busca instantânea com ícone de lupa: "Buscar por MAC ou usuário...".
   - Filtros em píluTodosos** (vermelho ativAtivososInativosos**.
   - Lista/Tabela com colunas: MAC, Servidor, Usuário, Senha, Validade, Status e Ações.
 Botão Copiar Dados:s:** Botão rápido com ícone de prancheta em cada linha que copia o texto pronto para WhatsApp:
    
     📱 Seus Dados de Acesso - RFlow Cine
     ━━━━━━━━━━━━━━━━━━━━━━
     MAC: [mac]
     Usuário: [username]
     Senha: [password]
     Servidor: [server]
     Validade: [validade]
     ━━━━━━━━━━━━━━━━━━━━━━
     Status: Ativo ✅
     Modal "Novo Dispositivo" (Exatamente como o print):):**
   - Título: "Novo dispositivo"
   - Subtítulo: "Informe o MAC e as credenciais Xtream utilizadas na ativação."
   - Campos:
   MAC Addressss** (placeholder: 00:1A:79:XX:XX:XX)
   URL do Servidoror** (valor padrão preenchido: http://jogar.nexusppmaster.eu:80)
   Usuárioio**
   Senhaha**
   User Agentnt** (padrão preenchido: IPTVSmarters)
   Dias de validadede** (campo numérico, padrão 30)
   Status inicialal** (select dropdown: Ativo / Inativo)
   - Botão vermeSalvarar** e botão neuCancelarar**.4. Aba "Revendedores" (Visível para Master e revendedores autorizados):

- Listagem com Nome, E-mail, Quantidade de MACs criados, Status (Ativo/Bloqueado) e Toggle "Pode criar outros revendedores".

- Modal para cadastrar novo revendedor criando a conta no Supabase Auth com login e senha.

- Ação rápida para suspender/bloquear o login do revendedor.



---



### 4. ENDPOINT PÚBLICO (/api/public/auth)

- Rota GET /api/public/auth?mac=00:1A:79:XX:XX:XX:

* Consulta o MAC na tabela devices.

* Se ativo e válido, responde HTTP 200:



    {
      "status": "success",
      "server": "[http://jogar.nexusppmaster.eu:80](http://jogar.nexusppmaster.eu:80)",
      "username": "usuario",
      "password": "123",
      "user_agent": "IPTVSmarters",
      "validity_days": 30
    }



* Se inativo, expirado ou não encontrado:



    {
      "status": "error",
      "message": "Dispositivo inativo ou não cadastrado"
    }

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mac-guard-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/874e0192-ea7c-4df8-96df-4c869a9b2739).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
