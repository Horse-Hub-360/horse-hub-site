# =============================================================================
#  HorseHub360 — site estático
#  Uso: make <alvo>   (sem argumentos mostra esta ajuda)
# =============================================================================

PORT     ?= 8899
HOST     ?= 127.0.0.1
URL      := http://$(HOST):$(PORT)/index.html
VIDEO_IN ?= assets/videos
IMG_DIR  ?= assets/img

.DEFAULT_GOAL := help
.PHONY: help dev open stop images videos posters size check clean-derived

## help: mostra os alvos disponíveis
help:
	@echo "HorseHub360 — alvos disponíveis:"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  make /' | sed 's/:/ —/'
	@echo ""
	@echo "Variáveis: PORT=$(PORT)  HOST=$(HOST)"

## dev: sobe o site localmente em http://127.0.0.1:8899 (Ctrl+C para parar)
dev:
	@echo "▸ Servindo em $(URL)  (Ctrl+C para parar)"
	@python3 -m http.server $(PORT) --bind $(HOST)

## open: abre o site no navegador padrão (o servidor precisa estar rodando)
open:
	@xdg-open "$(URL)" >/dev/null 2>&1 || echo "Abra manualmente: $(URL)"

## stop: encerra um servidor que tenha ficado rodando em segundo plano
stop:
	@# o [h] evita que o pkill case com o próprio comando
	@pkill -f "[h]ttp.server $(PORT)" && echo "▸ servidor na porta $(PORT) encerrado" \
		|| echo "▸ nenhum servidor rodando na porta $(PORT)"

## images: gera as variantes -800.jpg das fotos novas em assets/img (precisa de Pillow)
images:
	@python3 -c "$$OPTIMIZE_IMAGES"

## videos: recomprime os .mp4 originais de assets/videos para versões web (precisa de ffmpeg)
videos:
	@command -v ffmpeg >/dev/null || { echo "ffmpeg não encontrado"; exit 1; }
	@set -e; \
	for src in $(VIDEO_IN)/*_1280x720.mp4; do \
		[ -e "$$src" ] || { echo "▸ nenhum vídeo original encontrado"; exit 0; }; \
		base=$$(basename "$$src" .mp4); \
		out="$(VIDEO_IN)/$$base-web.mp4"; \
		echo "▸ $$src -> $$out"; \
		ffmpeg -v error -y -i "$$src" -an -movflags +faststart \
			-vf "scale=1280:-2,fps=25" -c:v libx264 -crf 30 -preset slow \
			-profile:v high -pix_fmt yuv420p "$$out"; \
	done

## posters: extrai o frame de capa (poster) de cada vídeo usado no site
posters:
	@command -v ffmpeg >/dev/null || { echo "ffmpeg não encontrado"; exit 1; }
	@set -e; \
	for name in hero-ride hero-ride-mobile stable-care bond; do \
		[ -f "$(VIDEO_IN)/$$name.mp4" ] || continue; \
		echo "▸ poster-$$name.jpg"; \
		ffmpeg -v error -y -ss 6 -i "$(VIDEO_IN)/$$name.mp4" -frames:v 1 \
			-q:v 4 "$(IMG_DIR)/poster-$$name.jpg"; \
	done

## size: mostra o peso dos assets (útil antes de publicar)
size:
	@du -sh $(IMG_DIR) $(VIDEO_IN) assets/css assets/js 2>/dev/null
	@echo "---"
	@du -sh --exclude=.git . 2>/dev/null | sed 's/$$/  (projeto)/'

## check: confere WhatsApp, prévia de compartilhamento e arquivos referenciados
check:
	@echo "▸ links do WhatsApp:"
	@grep -o 'wa\.me/[0-9]*' index.html | sort | uniq -c
	@echo "▸ prévia de compartilhamento (og:image precisa ser URL absoluta):"
	@grep -oE '<meta property="og:(url|image)" content="[^"]+"' index.html \
		| sed -E 's/.*content="([^"]+)"/  \1/' \
		| while read -r u; do \
			case "$$u" in https://*) echo "  OK       $$u";; \
			*) echo "  RELATIVA $$u  <-- o WhatsApp não gera prévia assim";; esac; \
		done
	@test -f $(IMG_DIR)/og-cover.jpg \
		&& echo "  capa:    $(IMG_DIR)/og-cover.jpg ($$(du -h $(IMG_DIR)/og-cover.jpg | cut -f1))" \
		|| echo "  FALTANDO $(IMG_DIR)/og-cover.jpg"
	@echo "▸ arquivos referenciados que não existem:"
	@grep -oE '(src|href|poster|data-video-src)="(assets/[^"]+)"' index.html \
		| sed -E 's/.*"(assets\/[^"]+)"/\1/' | sort -u \
		| while read -r f; do [ -f "$$f" ] || echo "  FALTANDO: $$f"; done; \
		echo "  (nada acima = tudo certo)"

## clean-derived: remove variantes geradas (-800.jpg e posters); recrie com make images/posters
clean-derived:
	@rm -f $(IMG_DIR)/*-800.jpg $(IMG_DIR)/poster-*.jpg
	@echo "▸ variantes removidas — rode 'make images' e 'make posters' para regerar"

# ---------------------------------------------------------------------------
# Script usado por 'make images': para cada foto sem variante, limita a 1600px
# de largura e gera a versão -800.jpg para o srcset. É idempotente: fotos que
# já possuem variante são ignoradas.
# ---------------------------------------------------------------------------
define OPTIMIZE_IMAGES
import glob, os
from PIL import Image

feitos = 0
for f in sorted(glob.glob('$(IMG_DIR)/*.jpg')):
    # posters de vídeo não entram no srcset e já saem no tamanho certo
    if f.endswith('-800.jpg') or os.path.basename(f).startswith('poster-'):
        continue
    small = f.replace('.jpg', '-800.jpg')
    if os.path.exists(small):
        continue
    im = Image.open(f).convert('RGB')
    w, h = im.size
    if w > 1600:
        im.resize((1600, round(h * 1600 / w)), Image.LANCZOS).save(
            f, 'JPEG', quality=76, optimize=True, progressive=True)
        im = Image.open(f).convert('RGB')
    thumb = im.copy()
    thumb.thumbnail((820, 10000), Image.LANCZOS)
    thumb.save(small, 'JPEG', quality=72, optimize=True, progressive=True)
    print('  %s -> %s (%dx%d)' % (os.path.basename(f), os.path.basename(small), *thumb.size))
    feitos += 1
print('  nenhuma foto nova' if not feitos else '  %d foto(s) processada(s)' % feitos)
endef
export OPTIMIZE_IMAGES
