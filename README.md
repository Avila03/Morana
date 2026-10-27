# Morana

Site, identidade visual e evolução digital da Morana Serviços LTDA., empresa de consultoria de gestão empresarial.

Este repositório é a base oficial para o desenvolvimento do site. A primeira versão contém a demonstração institucional criada a partir do manual e dos arquivos da marca fornecidos pela empresa.

## O que está incluído

- Apresentação institucional da Morana.
- Soluções de gestão com seleção interativa: estratégia, finanças, processos e pessoas.
- Método de trabalho e perguntas frequentes.
- Layout para computador e celular, menu móvel e navegação por teclado.
- Contato oficial em `comercial@moranaservicos.com.br`, com links diretos de e-mail.
- Formulário com envio em PHP para a Locaweb; em hospedagem estática, prepara uma mensagem para revisão e envio no aplicativo de e-mail.

Os serviços e o método apresentados mantêm o conteúdo inicial; sua revisão não é prioridade neste momento. A empresa atende diferentes portes e segmentos e não utiliza WhatsApp por enquanto. O site não usa banco de dados.

## Executar localmente

O visual usa HTML, CSS e JavaScript, sem instalação de dependências nem etapa de build. O encaminhamento pelo servidor usa PHP 7.4 ou superior, sem bibliotecas adicionais.

Na raiz do repositório:

```bash
python3 -m http.server 8080 --directory dist
```

Abra `http://localhost:8080` no navegador. Encerre o servidor com `Ctrl+C`.

Nesse servidor estático, o formulário prepara um e-mail, sem informar que ele foi enviado. A hospedagem de produção precisa executar PHP e disponibilizar a função `mail()` para o envio direto.

## Estrutura

```text
dist/
  index.html       Conteúdo e estrutura das páginas
  styles.css       Identidade visual e layout responsivo
  app.js           Abas de serviços, menu e fluxo de contato
  contato.php      Endpoint de disponibilidade e encaminhamento de contato
  contact-handler.php  Validação, proteção contra abuso e montagem da mensagem
  assets/          Marca, fotografia, fontes e licença da tipografia
AGENTS.md          Orientações para continuar o desenvolvimento
docs/LOCAWEB.md    Instruções de publicação e teste de recebimento
scripts/package_locaweb.py  Gera o ZIP de upload
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

O diretório a publicar é `dist/`. Não é necessário instalar pacotes nem executar build. Na Locaweb, envie o **conteúdo** dessa pasta para `public_html`.

Para gerar o pacote de upload:

```bash
python3 scripts/package_locaweb.py
```

O ZIP será criado em `artifacts/morana-locaweb.zip`. Leia [as instruções de publicação](docs/LOCAWEB.md).

O envio PHP usa o e-mail comercial como destinatário, remetente e envelope de retorno; o e-mail do visitante fica no `Reply-To`. Os campos são validados no servidor, há um campo de detecção de preenchimento automatizado e limites temporários de envio. Os contadores ficam fora da pasta pública e não guardam nome, e-mail, mensagem nem IP em texto.

O GitHub Pages publica a prévia em [avila03.github.io/Morana/dist/](https://avila03.github.io/Morana/dist/). Como ele não executa PHP, ali o formulário prepara a mensagem para envio no aplicativo de e-mail.

A demonstração existente está em [morana-consultoria-demo.pastellion131.chatgpt.site](https://morana-consultoria-demo.pastellion131.chatgpt.site), com acesso pela conta ChatGPT autorizada. O arquivo `.openai/hosting.json` preserva a identidade desse site. Um commit no GitHub, por si só, não atualiza essa demonstração automaticamente.

## Verificação

```bash
node --check dist/app.js
php -l dist/contato.php
php -l dist/contact-handler.php
php tests/contact-handler-test.php
```

Os testes do servidor substituem o transporte de e-mail por uma função local e não enviam mensagens a ninguém. Verifique o recebimento em `comercial@moranaservicos.com.br` depois do upload à Locaweb: o retorno positivo de `mail()` confirma o aceite pelo servidor de envio, não a entrega final.
