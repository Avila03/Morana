# Morana

Site, identidade visual e evolução digital da Morana Serviços LTDA., empresa de consultoria de gestão empresarial.

Este repositório é a base oficial para o desenvolvimento do site. A primeira versão contém a demonstração institucional criada a partir do manual e dos arquivos da marca fornecidos pela empresa.

## O que está incluído

- Apresentação institucional da Morana.
- Soluções de gestão com seleção interativa: estratégia, finanças, processos e pessoas.
- Método de trabalho e perguntas frequentes.
- Layout para computador e celular, menu móvel e navegação por teclado.
- Formulário que simula o fluxo de contato, sem enviar mensagens ou armazenar dados.

Os textos, os serviços e o método apresentados são propostas para validação pela empresa. Banco de dados, envio real de contatos e integrações comerciais ainda não fazem parte desta versão.

## Executar localmente

O site usa HTML, CSS e JavaScript, sem instalação de dependências nem etapa de build.

Na raiz do repositório:

```bash
python3 -m http.server 8080 --directory dist
```

Abra `http://localhost:8080` no navegador. Encerre o servidor com `Ctrl+C`.

## Estrutura

```text
dist/
  index.html       Conteúdo e estrutura das páginas
  styles.css       Identidade visual e layout responsivo
  app.js           Abas de serviços, menu e contato demonstrativo
  assets/          Marca, fotografia, fontes e licença da tipografia
AGENTS.md          Orientações para continuar o desenvolvimento
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

O diretório a publicar em uma hospedagem estática é `dist/`. Não é necessário instalar pacotes nem executar build.

A demonstração existente está em [morana-consultoria-demo.pastellion131.chatgpt.site](https://morana-consultoria-demo.pastellion131.chatgpt.site), com acesso pela conta ChatGPT autorizada. O arquivo `.openai/hosting.json` preserva a identidade desse site. Um commit no GitHub, por si só, não atualiza essa demonstração automaticamente.

## Próximas etapas

Validar os serviços e textos institucionais, adicionar contatos oficiais e definir o destino do formulário antes de ativar atendimento real. A evolução do site deve partir deste repositório, na branch `main`.
