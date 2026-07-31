# HorseHub360 — Landing Page

Site institucional do **HorseHub360**, plataforma de gestão 360° para haras, centros de
treinamento e profissionais do meio equestre.

Site estático, sem build e sem dependências de runtime: HTML + CSS + JavaScript puro.
Basta servir a pasta.

---

## Rodando localmente

```bash
make dev       # sobe em http://127.0.0.1:8899
make open      # abre no navegador (com o servidor já rodando)
```

Para usar outra porta:

```bash
make dev PORT=3000
```

`make dev` é apenas um atalho para `python3 -m http.server`. Qualquer servidor
estático funciona (`npx serve`, `php -S`, Live Server do VS Code etc.) — o importante
é **não abrir o `index.html` direto pelo `file://`**, porque os vídeos e algumas
imagens não carregam nesse modo.

### Outros alvos do Makefile

| Alvo                 | O que faz                                                            |
| -------------------- | -------------------------------------------------------------------- |
| `make help`          | Lista todos os alvos (é o padrão ao rodar `make` sem argumentos)      |
| `make dev`           | Sobe o servidor local                                                |
| `make open`          | Abre o site no navegador padrão                                      |
| `make stop`          | Encerra um servidor esquecido rodando em segundo plano               |
| `make images`        | Gera as variantes `-800.jpg` das fotos novas (requer Pillow)         |
| `make videos`        | Recomprime `.mp4` originais para versão web (requer ffmpeg)          |
| `make posters`       | Extrai o frame de capa de cada vídeo                                 |
| `make size`          | Mostra o peso dos assets antes de publicar                           |
| `make check`         | Confere links do WhatsApp e arquivos referenciados que não existem   |
| `make clean-derived` | Apaga variantes geradas (`-800.jpg` e posters)                       |

---

## Estrutura

```
.
├── index.html              # a página inteira (14 seções)
├── Makefile
├── assets/
│   ├── css/style.css       # design system + todas as seções + responsivo
│   ├── js/main.js          # parallax, reveals, menu, FAQ, vídeos sob demanda
│   ├── img/                # fotos (cada uma em 1600px e 820px para srcset)
│   ├── videos/             # vídeos de fundo (originais + versões web)
│   └── *.png               # logos e ícone do WhatsApp
└── README.md
```

### Seções da página

Hero → faixa de destaques → *A plataforma* → *8 módulos* → 5 funcionalidades em
detalhe → faixa com citação → *Passaporte digital* → *Portal do proprietário* →
*Como funciona* → *Para quem é* → galeria → FAQ → CTA final → rodapé.

---

## Como personalizar

### Número do WhatsApp

Está direto no HTML, em 4 pontos (hero, CTA final, rodapé e botão flutuante).
Para trocar, procure por `wa.me/` no `index.html` e substitua o número —
formato: DDI + DDD + número, só dígitos (`5517997032430`).

```bash
sed -i 's|wa.me/5517997032430|wa.me/SEUNOVONUMERO|g' index.html
make check      # confirma que todos os links apontam para o mesmo número
```

### Trocar as fotos

As fotos atuais são de banco de imagens gratuito. Para usar fotos reais do haras,
basta substituir os arquivos em `assets/img/` mantendo os nomes (`training.jpg`,
`feeding.jpg`, `health.jpg`, `stable-hall.jpg`…) e rodar:

```bash
make clean-derived   # remove as variantes antigas
make images          # gera as novas variantes -800.jpg do srcset
make posters         # se também trocou os vídeos
```

Cada `<img>` usa `srcset` com duas larguras (820px e 1600px). Fotos maiores que
1600px de largura são redimensionadas automaticamente pelo `make images`.

O hero não usa foto: é vídeo (veja abaixo). A `hero.jpg` continua no repositório
porque é a imagem de compartilhamento (`og:image`) em redes sociais e WhatsApp.

### Vídeos

O site usa vídeo em três lugares: **hero** (`hero-ride.mp4`), **seção Saúde**
(`stable-care.mp4`) e **faixa da citação** (`bond.mp4`). Eles:

- rodam também no celular (são leves: 0,3 a 1,8 MB cada);
- não carregam em `prefers-reduced-motion`, conexões 2G ou modo de economia de dados;
- ficam com o `poster` (imagem extraída do próprio vídeo) nesses casos e quando o
  navegador bloqueia o autoplay;
- só começam a baixar quando entram na tela, e pausam ao sair — exceto o hero, que
  inicia junto com a página.

Cada `<video>` é declarado assim:

```html
<video data-video-src="assets/videos/arquivo.mp4"          <!-- versão padrão -->
       data-video-src-mobile="assets/videos/arquivo-mobile.mp4"  <!-- opcional -->
       data-poster-mobile="assets/img/poster-arquivo-mobile.jpg" <!-- opcional -->
       poster="assets/img/poster-arquivo.jpg"
       muted loop playsinline preload="none"></video>
```

O `src` nunca vai direto no HTML — quem decide é o `main.js`, que escolhe a versão
vertical em telas até 860px e só então dispara o download.

**Vídeo do hero:** como o hero fica muito estreito no celular, existe
`hero-ride-mobile.mp4`, um recorte vertical (3:4) gerado com:

```bash
ffmpeg -i assets/videos/hero-ride.mp4 -an -movflags +faststart \
  -vf "crop=540:720:408:0,fps=25" -c:v libx264 -crf 30 -preset slow \
  -pix_fmt yuv420p assets/videos/hero-ride-mobile.mp4
make posters   # regenera as capas, inclusive a vertical
```

### Trocar uma imagem por vídeo

1. Coloque o `.mp4` em `assets/videos/` e rode `make videos` (comprime) e
   `make posters` (gera a capa).
2. No `index.html`, troque a `<figure class="frame">` com `<img>` por:

```html
<figure class="frame frame--video">
  <video class="media-video" data-video-src="assets/videos/nome.mp4"
         poster="assets/img/poster-nome.jpg"
         muted loop playsinline preload="none"
         aria-label="descrição do que aparece no vídeo"></video>
</figure>
```

O restante (carregamento sob demanda, pausa fora da tela, respeito a
`prefers-reduced-motion`) já funciona sozinho.

Os arquivos `*_1280x720.mp4` são os originais (~26 MB somados) — podem ser removidos
do repositório, já que as versões web estão em uso e somam ~3 MB.

### Redes sociais

Os links do rodapé estão como `href="#"` — substitua pelos perfis reais
(procure por `footer__social` no `index.html`).

### Prévia ao compartilhar o link (WhatsApp, Facebook, LinkedIn)

A capa é `assets/img/og-cover.jpg` (1200×630, ~110 KB) — a foto do haras com a marca,
a chamada principal e o selo. É gerada fora do site, não é screenshot da página.

**O domínio precisa estar correto.** As tags `og:url`, `og:image` e afins usam URL
absoluta (`https://horsehub360.com.br/...`). Com caminho relativo o WhatsApp
simplesmente não mostra prévia nenhuma. Se o site for para outro endereço:

```bash
sed -i 's|https://horsehub360.com.br|https://SEU-DOMINIO|g' index.html
make check    # lista as URLs e avisa se alguma ficou relativa
```

Requisitos que o WhatsApp impõe e que já estão atendidos: imagem em JPG/PNG,
abaixo de 600 KB, acessível publicamente (sem login) e servida por HTTPS.

**Cache:** o WhatsApp guarda a prévia por vários dias. Depois de publicar uma
alteração, force a releitura com o
[depurador do Facebook](https://developers.facebook.com/tools/debug/) ("Scrape
again") ou compartilhando `https://seu-dominio/?v=2` — a query string derruba o
cache. Só é possível testar de verdade com o site no ar; em `localhost` nenhum
robô consegue acessar.

---

## Acessibilidade e performance

- Todo o movimento (parallax, reveals, ken burns, ticker) é desligado sob
  `prefers-reduced-motion: reduce`.
- Imagens com `loading="lazy"`, `width`/`height` declarados e `srcset` responsivo.
- Vídeos com `preload="none"` e carregamento sob demanda por `IntersectionObserver`.
- FAQ com `aria-expanded`, menu com `aria-controls`, foco visível em todos os
  elementos interativos, textos alternativos descritivos nas fotos.

---

## Publicação

Como é um site estático, qualquer hospedagem serve — GitHub Pages, Netlify, Vercel,
Cloudflare Pages ou um diretório em servidor próprio. Envie a pasta inteira
(`index.html` + `assets/`). Não há passo de build.

Antes de publicar:

```bash
make check    # links e arquivos
make size     # peso total dos assets
```
