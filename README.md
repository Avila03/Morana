# Morana

Site, identidade visual e evolução digital da Morana Serviços LTDA., empresa de consultoria de gestão empresarial.

Este repositório é a base oficial para o desenvolvimento do site. A primeira versão contém a demonstração institucional criada a partir do manual e dos arquivos da marca fornecidos pela empresa.

## O que está incluído

- Apresentação institucional da Morana.
- Soluções de gestão com seleção interativa: estratégia, finanças, processos e pessoas.
- Seleção do desafio com indicação da solução e interesse já preenchido no contato.
- Quatro páginas próprias para os serviços, sitemap, metadados de busca e imagem de compartilhamento da marca.
- Confirmação automática por e-mail após o aceite do contato comercial, com texto fixo e controle de envios repetidos.
- Método de trabalho e perguntas frequentes.
- Layout para computador e celular, menu móvel e navegação por teclado.
- Contraste entre blocos claros e escuros, grafismos derivados do símbolo da marca e ilustrações conceituais próprias para cada serviço.
- Movimento discreto nas entradas e trocas de serviço, com respeito à preferência por movimento reduzido. `dist/brand.css` reúne a direção visual sobre a base responsiva de `styles.css`.
- Contato oficial em `comercial@moranaservicos.com.br`, com links diretos de e-mail.
- Formulário com envio em PHP para a Locaweb; em hospedagem estática, prepara uma mensagem para revisão e envio no aplicativo de e-mail.

Os serviços e o método apresentados mantêm o conteúdo inicial; sua revisão não é prioridade neste momento. A empresa atende diferentes portes e segmentos e não utiliza WhatsApp por enquanto. O site não usa banco de dados.

## Executar localmente

O visual usa HTML, CSS e JavaScript, sem instalação de dependências nem etapa de build. O encaminhamento pelo servidor usa PHP 7.4 ou superior. A cópia necessária do PHPMailer 7.1.1 e sua licença já acompanham o pacote; não há instalação de Composer na hospedagem.

Na raiz do repositório:

```bash
python3 -m http.server 8080 --directory dist
```

Abra `http://localhost:8080` no navegador. Encerre o servidor com `Ctrl+C`.

Nesse servidor estático, o formulário prepara um e-mail, sem informar que ele foi enviado. Em produção, o envio usa SMTP autenticado com TLS após a ativação da caixa comercial. Se não houver configuração SMTP e `mail()` estiver disponível, o envio nativo permanece como alternativa.

## Estrutura

```text
dist/
  index.html       Conteúdo e estrutura das páginas
  styles.css       Identidade visual e layout responsivo
  app.js           Abas de serviços, menu e fluxo de contato
  contato.php      Endpoint de disponibilidade e encaminhamento de contato
  contact-handler.php  Validação, proteção contra abuso e montagem da mensagem
  contact-mailer.php   SMTP, configuração privada e validação da ativação
  configurar-contato.php  Página HTTPS para ativar a caixa comercial
  contact-setup-key.php   Impressão digital e validade do código de uso único
  vendor/phpmailer/    Biblioteca e licença para SMTP
  assets/          Marca, fotografia, fontes e licença da tipografia
AGENTS.md          Orientações para continuar o desenvolvimento
docs/LOCAWEB.md    Instruções de publicação e teste de recebimento
scripts/package_locaweb.py  Gera o ZIP de upload
scripts/check_locaweb_deploy.py  Confere o site publicado por HTTPS
scripts/rotate_contact_setup_key.py  Renova o código de ativação localmente
.github/workflows/deploy-locaweb.yml  Publicação na Locaweb pelo Actions
tests/            Testes sem envio real de e-mail
.openai/hosting.json  Identidade da demo já publicada no Sites
```

## Identidade visual

| Uso | Valor |
| --- | --- |
| Grafite | `#29383E` |
| Azul acinzentado | `#516D79` |
| Cinza claro | `#D7D7D6` |
| Tipografia do site | Montserrat, servida localmente |
| Logotipo | Arquivos originais da marca, preservando seu desenho e tipografia |

Fotografia arquitetônica ilustrativa de Sean Pollock / Unsplash, identificador `photo-1486406146926-c627a92ad1ab`. A imagem não representa as instalações da empresa. Montserrat é distribuída sob a SIL Open Font License; a licença acompanha os arquivos em `dist/assets/Montserrat-LICENSE.txt`.

## Publicação

O diretório a publicar é `dist/`. Não é necessário instalar pacotes nem executar build. O workflow **Publicar na Locaweb** envia seu conteúdo diretamente para `public_html/`, para abrir em [moranaservicos.com.br](https://moranaservicos.com.br/) sem subpasta.

Configure os Secrets `LOCAWEB_FTP_HOST`, `LOCAWEB_FTP_USER` e `LOCAWEB_FTP_PASSWORD` em **Settings → Secrets and variables → Actions**. Depois, use **Actions → Publicar na Locaweb → Run workflow**, selecionando `main`. Alterações do site na `main` também iniciam a publicação automática após essa configuração. Sem credenciais, nenhum arquivo é enviado. A conexão usa FTP na porta 21, autorizado para o servidor desta conta; a checagem do site publicado usa HTTPS.

O workflow executa verificações e publica diretamente na raiz, sem etapa de backup. O pacote inclui `.htaccess` para priorizar `index.html`. Depois do envio, confere os arquivos públicos e a página inicial por HTTPS. A disponibilidade do contato é informada separadamente; a caixa SMTP deve ser ativada pela página segura. Consulte [as instruções completas](docs/LOCAWEB.md#ativar-o-formulario-por-smtp).

Para publicar manualmente, envie o **conteúdo** de `dist/` para a pasta escolhida na hospedagem.

Para gerar o pacote de upload:

```bash
python3 scripts/package_locaweb.py
```

O ZIP será criado em `artifacts/morana-locaweb.zip`. Leia [as instruções de publicação](docs/LOCAWEB.md).

O envio PHP usa o e-mail comercial como destinatário, remetente e envelope de retorno; o e-mail do visitante fica no `Reply-To`. Os campos são validados no servidor, há um campo de detecção de preenchimento automatizado e limites temporários de envio. Os contadores ficam fora da pasta pública e não guardam nome, e-mail, mensagem nem IP em texto.

A ativação em `https://moranaservicos.com.br/configurar-contato.php` exige um código aleatório de uso único, válido por 24 horas. A senha da caixa postal é informada somente nessa página HTTPS; a configuração fica em `.morana-private/smtp.json`, fora de `public_html`, com acesso privado. A senha não passa pelo GitHub nem pelo FTP de publicação. O SMTP usa `email-ssl.com.br`, porta 465 com TLS, ou 587 com STARTTLS; certificados são verificados. Salvar a configuração testa autenticação sem enviar uma mensagem. O recebimento final deve ser conferido com um teste pelo formulário.

O GitHub Pages publica a prévia em [avila03.github.io/Morana/dist/](https://avila03.github.io/Morana/dist/). Como ele não executa PHP, ali o formulário prepara a mensagem para envio no aplicativo de e-mail.

A demonstração existente está em [morana-consultoria-demo.pastellion131.chatgpt.site](https://morana-consultoria-demo.pastellion131.chatgpt.site), com acesso pela conta ChatGPT autorizada. O arquivo `.openai/hosting.json` preserva a identidade desse site. Um commit no GitHub, por si só, não atualiza essa demonstração automaticamente.

## Verificação

As páginas publicadas continuam estáticas, sem instalação de dependências na Locaweb. Ao alterar o cabeçalho, o formulário ou o rodapé de `dist/index.html`, execute `python3 scripts/build_service_pages.py` para atualizar as páginas de serviços. O texto específico de cada serviço está nesse gerador. A imagem social tem fonte vetorial em `dist/assets/morana-compartilhamento.svg` e versão PNG para compartilhamento.

```bash
node --check dist/app.js
python3 scripts/build_service_pages.py --check
python3 tests/site-test.py
php -l dist/contato.php
php -l dist/contact-handler.php
php tests/contact-handler-test.php
php tests/contact-mailer-test.php
```

Os testes do servidor substituem o transporte de e-mail por uma função local e não enviam mensagens a ninguém. Verifique o recebimento em `comercial@moranaservicos.com.br` após a ativação: o aceite pelo servidor SMTP ou por `mail()` não comprova a entrega à caixa postal.
