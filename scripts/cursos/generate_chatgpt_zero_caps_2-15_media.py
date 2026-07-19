# -*- coding: utf-8 -*-
"""Leitura 2.0 — REGENERACAO chatgpt-zero, caps 2-5,7-15 (13 caps, exclui
o piloto manual 1 e 6, ja aprovado pelo Ricardo). Substitui a versao
rejeitada (lookup table fixa de 5 frases genericas por slot, video motion
100% fixo). Cada prompt abaixo eh escrito a mao a partir do texto REAL e
reescrito de cada capitulo (content_drafts/chatgpt-zero_caps_2-15.json) —
mesma posicao de slot / mesmo motivo composicional (linguagem de design),
mas objetos concretos unicos por capitulo. Plumbing tecnico (build_image,
build_video, upload, wait, THEMES, FUSION) copiado verbatim de
generate_course_inline_media.py — NAO reinventado.
Saida: C:/WORKS/ComfyUI/output/course_media/chatgpt-zero/inline/capNN-*
Seeds: img BASE_SEED(7400)+cap*10+slot_index · video 9300+cap*10+(0|5)
       (cap 1/6 = piloto ja usou suas seeds; caps 16-30 = outro agente,
       ranges disjuntos, sem colisao)"""
import json, sys, time, uuid, urllib.request
from pathlib import Path

API = "http://localhost:8000"
OUT_DIR = Path("C:/WORKS/ComfyUI/output/course_media/chatgpt-zero/inline")
NEGATIVE = "blurry, low quality, still frame, watermark, text, deformed, glitch, jitter"
BASE_SEED = 7400

FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

# 6 temas do curso (mesmos do header, copiados verbatim do script original) -> cenario + glow
THEMES = [
    ("real cozy kitchen table with a laptop and fresh coffee, morning light through a window", "lime"),
    ("real writer's desk with beautiful recipe cards and wooden word blocks being assembled", "violet"),
    ("real tidy home office with a paper agenda, sticky notes becoming neat floating lists", "cyan"),
    ("real content creator desk with camera, microphone and notebook, drafts coming alive", "rose"),
    ("real library study desk with open books, warm lamp and floating flashcards", "violet"),
    ("real artisan workbench where a crafted piece is being polished under a focused lamp", "gold"),
]

SLOTS_IMG = ["sistema", "intencao", "fluxo", "cenario", "validacao", "dica"]
SLOTS_VIDEO = ["fluxo", "dica"]

# ─────────────────────────────────────────────────────────────────────────
# Prompts bespoke por capitulo, escritos a partir do texto real de cada um.
# sistema   ≈ 1o paragrafo de Conceitos-Chave
# intencao  ≈ 2o paragrafo de Conceitos-Chave
# fluxo     ≈ Fluxo de Execucao (5 passos) — tambem base do video
# cenario   ≈ Cenarios Aplicados
# validacao ≈ Erros Comuns
# dica      ≈ Dica Pro (blockquote) — tambem base do video
# ─────────────────────────────────────────────────────────────────────────
CHAPTER_DATA = {
    2: {  # Configuração: instruções personalizadas (2 caixas) vs memória
        "sistema": "the mascot carefully arranging two distinct glowing glass tablets side by side into a tower — one tablet etched with a small briefcase and audience-figures icon for stable facts, the other etched with tone waveform lines for response style — keeping them from blending into a single blurred layer",
        "intencao": "on one side the mascot deliberately writing all at once on a solid glowing tablet labeled with a pen icon for personalized instructions, on the other side a soft cloud of small glowing fragments slowly drifting in one by one and settling into a loose pile representing memory built from many past conversations, a clear gap of soft light between the deliberate tablet and the slowly accumulating cloud",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from a closed glowing settings-gear panel, through two glowing instruction tablets, past a small pile of glowing memory fragments being reviewed, to a single glowing question-mark stone at the end, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The settings-gear stone lights up first, then the two instruction tablet stones brighten as if being filled with text, then the memory-fragment stone glows softly as fragments are sorted, the tiny mascot walks gently forward across the stones, the final question-mark stone pulses as if being tested, warm dust motes float in the light, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table and condensing into two crisp glowing instruction tablets, one showing a small dumbbell and an encouraging tone waveform for a personal trainer's setup, the other showing a handcrafted pottery icon and a warm personal tone waveform for an artisan seller's setup, the mascot proudly holding both up",
        "validacao": "the mascot examining two blank glowing instruction tablets through a large magnifying glass while a faint ghost of an attached document dissolves into mist beside them, a kind amber warning light above, a small round blank wax stamp resting unused",
        "dica": "the mascot writing a glowing checklist card etched with a small mirror icon reflecting looping summary text, behind it a large friendly launch button waiting dimmed until the reflection looks complete",
        "dica_motion": "The mirror-icon checklist glows as reflected summary text softly appears line by line, the mascot's pen taps twice in quiet confirmation, the large button in the background slowly brightens as the reflected summary completes, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    3: {  # Aplicação: pedido de aumento de salário
        "sistema": "the mascot carefully stacking two kinds of translucent glowing glass layers into a tower — bright confident layers labeled with a speech-bubble icon for arguments the mascot may shape, and dimmer human-held layers labeled with a small coin icon that only a real person's hand may place, keeping the two kinds from mixing into the same layer",
        "intencao": "on one side the mascot calmly writing on a small glowing planning card labeled with four stacked note icons — facts, argument, reaction, tone — on the other side a friendly robotic arm assembling those four pieces one careful stage at a time instead of all at once, a clear gap of soft light between thinking and doing",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from a single glowing percentage-sign card, through a stack of fact cards, past a stone showing a small argumentative speech bubble, through an external glowing magnifying-glass stone checking a data card, to a final stone shaped like a rehearsed speech balloon, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The percentage-sign stone pulses first, then the fact-card stones brighten in sequence, the speech-bubble objection stone flickers with a testing glow, the magnifying-glass stone shines brighter as it checks the data card, the tiny mascot walks gently forward across the stones toward the final rehearsed speech-balloon stone, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table and condensing into one crisp glowing argument card showing a small upward percentage arrow and a tidy project-result icon, the mascot proudly holding it up while a second faint glowing card labeled with a coin-range icon hovers uncertainly beside an open external research book waiting to confirm it",
        "validacao": "the mascot examining a glowing coin-range card through a large magnifying glass against an unrolled glowing external research map, a kind amber warning light above, a small round blank wax stamp resting unused beside an unopened objection card",
        "dica": "the mascot writing a glowing checklist card while a small shadowy mirrored version of the mascot on the other side plays devil's advocate, arms crossed, behind them a large friendly launch button dimmed until the toughest objection is answered",
        "dica_motion": "The checklist card glows as check marks appear, the shadowy mirrored figure leans in with a challenging gesture then softens, the large button in the background slowly brightens as the toughest objection is resolved, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    4: {  # Erros/validação: viés de formatação, citações inventadas
        "sistema": "the mascot carefully stacking translucent glowing glass layers into a tower, the layers each polished to a flawless shine, but the mascot pausing mid-stack to tap one shiny layer that rings hollow — surface polish not matching the dim uncertain glow hidden inside it",
        "intencao": "on one side the mascot calmly writing a small glowing citation card with a convincing book-and-gavel icon, on the other side a friendly robotic arm holding up an identical-looking card that dissolves into mist when touched, a clear gap of soft light between the confident-looking card and the one that cannot hold together",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from a three-tier risk-level card (low, medium, high), through a stone circling specific numbers and names, past an external glowing reference-book stone, through a stone where the mascot questions its own glowing card, to a final approval-stamp stone, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The three-tier risk card stone lights up first, then the circled-numbers stone brightens, the external reference-book stone glows as pages turn, the mascot pauses at the self-questioning stone with a thoughtful gesture, the final approval-stamp stone brightens only at the very end, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table splitting into two crisp glowing pages — one a formal dismissal letter with a small gavel icon and a faint crack running through its cited article number, the other a tidy bibliography page whose book-spine icons shimmer and dissolve one by one when the mascot reaches to touch them",
        "validacao": "the mascot examining a glowing formal document through a large magnifying glass, a kind amber warning light flickering above a suspiciously perfect citation, a small round blank wax stamp resting unused beside two contradicting glowing cards side by side",
        "dica": "the mascot writing a glowing checklist card with a direct question mark icon pointed at a source-citation card, behind it a large friendly launch button dimmed until the source admits uncertainty",
        "dica_motion": "The checklist card glows as the question mark pulses toward the citation card, the citation card flickers uncertainly and dims in honest admission, the large button in the background slowly brightens once the uncertainty is acknowledged, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    5: {  # Projeto/entrega: semana documentada, professora e loja
        "sistema": "the mascot placing the final translucent glowing layer on a steady completed tower built over several small day-marked platforms, comparing it against a single wobbly isolated layer floating alone nearby to show the difference between one lucky attempt and a repeated pattern",
        "intencao": "on one side the mascot calmly writing on a small glowing daily log card with a pen icon, on the other side a foggy cloud-shaped memory bubble quietly erasing its own rough edges and keeping only the shiny parts, a clear gap of soft light between the honest written log and the self-editing memory cloud",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from two instruction tablets, through three small glowing task icons in a row, past a stack of daily log cards, through a stone where the log pages are being reviewed, to a final single glowing one-page manual stone, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The instruction-tablet stone glows first, then the three task-icon stones brighten one by one, the log-card stack pulses as pages accumulate, the review stone glows as pages are compared side by side, the tiny mascot steps onto the final one-page manual stone as it brightens fully, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table condensing into two crisp glowing results — a lesson-plan card that sharpens into focus only once a small clock-and-grade-level icon is added beside it, and a collection-message card whose tone visibly warms and softens from a cold formal glow to a friendly one, the mascot proudly holding both up",
        "validacao": "the mascot checking a row of seven small day-marked log cards through a large magnifying glass, one card conspicuously blank and greyed out mid-week, a kind amber warning light above, a small round blank wax stamp resting unused beside an unfinished one-page manual",
        "dica": "the mascot gathering a full week of glowing log cards into one hand and feeding them toward a large friendly launch button, the button dimmed until all seven cards have been absorbed into a single glowing page",
        "dica_motion": "The seven log cards drift one by one into the mascot's outstretched hand and merge into a single glowing page, the large button in the background brightens gradually as each card is absorbed, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    7: {  # Configuração: preparar material, busca web, Canvas, templates
        "sistema": "the mascot carefully stacking translucent glowing glass layers into a tower, reaching for the next layer only to find empty air where a reference-text page should be, an incomplete gap glowing faintly where the missing material was supposed to sit",
        "intencao": "on one side the mascot flipping on a small glowing web-search switch beside a card showing today's date, on the other side a friendly robotic arm unrolling a long glowing Canvas scroll meant for editing piece by piece, a clear gap of soft light between the quick lookup switch and the long editable scroll",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from a stack of reference pages, through a glowing web-search toggle stone, past a stone splitting into Canvas scroll versus plain chat bubble, through a four-part template stone (role, task, context, format), to a final glowing saved-note stone, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The reference-page stack glows first, then the web-search toggle stone flips on with a soft click of light, the Canvas-versus-chat stone splits and one path brightens, the four-part template stone lights each of its four corners in sequence, the tiny mascot steps onto the final saved-note stone as it seals shut with a gentle glow, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table condensing into two crisp glowing results — a real estate description card with bracket-shaped placeholders and a small house icon, and a news card glowing brighter only after a small web-search icon lights up beside it, the mascot proudly holding both up",
        "validacao": "the mascot examining an empty-handed prompt card through a large magnifying glass beside a stack of unused reference pages, a kind amber warning light above a Canvas scroll unrolled far too long for a short simple answer, a small round blank wax stamp resting unused",
        "dica": "the mascot writing a glowing checklist card that folds itself into a template shape with small bracket-shaped placeholder slots opening up along its edges, behind it a large friendly launch button dimmed until every bracket slot is ready",
        "dica_motion": "The checklist card folds and reshapes into a template with bracket-shaped slots opening one by one along its edges, the mascot's pen taps each slot into place, the large button in the background slowly brightens as the last bracket slot opens, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    8: {  # Aplicação: campanha de e-mail, loja de velas
        "sistema": "the mascot carefully stacking translucent glowing glass layers into a tower, the first layer set down calm and cool-toned, the mascot pausing to notice it lacks the warm urgent glow the finished tower will need, about to reach for a brighter replacement layer",
        "intencao": "on one side the mascot calmly writing one wide glowing planning card covering goal, product and audience all at once, on the other side a friendly robotic arm narrowing that single card into three smaller focused cards — body, subject lines, channel — one at a time instead of all together, a clear gap of soft light between the wide start and the narrowing sequence",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from one wide glowing campaign card, through a stone where the card is being read closely for gaps, past three small glowing subject-line variant stones, through a stone reshaping into a social-post format, to a final magnifying-glass stone checking price and date numbers, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The wide campaign card stone glows first, then it dims slightly as the gap-reading stone highlights a missing warm tone, the three subject-line stones flicker in sequence as each is compared, the channel-reshaping stone morphs from an envelope shape into a small photo-post shape, the tiny mascot steps onto the final magnifying-glass stone checking the price and date, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table condensing into three crisp glowing results — a warmly glowing email card with a small candle icon and an urgency clock, three flickering subject-line ribbons beside it, and a square photo-post card with empty space left for an image, the mascot proudly holding all three up",
        "validacao": "the mascot examining a glowing email card through a large magnifying glass, cross-checking a discount percentage and a deadline date against a small calendar card, a kind amber warning light above, a small round blank wax stamp resting unused beside a social-post card still shaped exactly like the email",
        "dica": "the mascot writing a glowing checklist card sorting three small subject-line ribbons into three labeled slots — a clock icon for urgency, a question mark for curiosity, a gift icon for benefit — behind it a large friendly launch button dimmed until all three are sorted",
        "dica_motion": "The three subject-line ribbons drift and settle one by one into their labeled slots — clock, question mark, gift — the mascot's pen checks each one off, the large button in the background slowly brightens as the last ribbon settles into place, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    9: {  # Erros/validação: diagnosticar prompts que falham
        "sistema": "the mascot carefully stacking translucent glowing glass layers into a tower, two layers pulling in opposite directions — one glowing layer trying to shrink small and another trying to expand wide at the same time — jamming against each other instead of stacking cleanly",
        "intencao": "on one side the mascot calmly writing on a small glowing planning card holding just one task icon, on the other side a friendly robotic arm juggling three separate glowing task icons at once — review, summary, title — each one wobbling and losing focus, a clear gap of soft light between the single clear card and the overloaded juggling arm",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from a stone showing two clashing arrows, through a stone with three task icons splitting apart, past a fading glowing restriction card being checked, through a single isolated glowing variable stone, to a final written note stone, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The clashing-arrows stone pulses with tension first, then the three task icons visibly separate and space out on the next stone, the fading restriction card brightens again as it's rechecked, a single variable stone glows alone while the others dim, the tiny mascot steps onto the final note stone as it seals with a satisfied glow, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table condensing into two crisp glowing results — a small tidy card showing either ten short bullet points or three clean lines, never both squeezed together, and a long glowing scroll of many message bubbles with one faded budget card near the start being relit and pulled forward to the front, the mascot proudly presenting both",
        "validacao": "the mascot examining a glowing contradictory instruction card through a large magnifying glass, three overlapping task icons tangled together beside a long faded scroll of old messages, a kind amber warning light above, a small round blank wax stamp resting unused",
        "dica": "the mascot writing a glowing checklist card with a direct question aimed at two clashing arrow icons, behind it a large friendly launch button dimmed until the arrows resolve into a single aligned direction",
        "dica_motion": "The checklist card glows as the question is posed to the two clashing arrows, the arrows slowly rotate and align into one single direction, the large button in the background brightens once alignment is reached, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    10: {  # Projeto/entrega: biblioteca de prompts/templates
        "sistema": "the mascot placing the final translucent glowing layer on a steady completed tower, then setting a labeled glowing template plate beside it that can be reused instantly on a second tower forming nearby without restacking each layer individually",
        "intencao": "on one side the mascot calmly writing on a small glowing planning card with fixed unchanging text, on the other side a friendly robotic arm inserting small bracket-shaped placeholder tiles into open slots on that same card, a clear gap of soft light between the fixed wording and the swappable bracket tiles",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from a row of small glowing task-list icons, through a stone showing a card filling with bracket placeholders, past a stone testing against a real pasted case, through a single glowing bound-document stone gathering them all, to a final calendar stone marking two weeks ahead, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The row of task-list icons glows one by one, the bracket-placeholder stone lights each slot as it's filled, the real-case testing stone flickers as it's checked against actual pasted text, the bound-document stone brightens as templates gather inside it, the tiny mascot steps onto the final calendar stone as a two-week marker softly glows, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table condensing into three crisp glowing template cards — a meeting-notes card gaining a small project-name tag, a complaint-response card gaining a severity-level dial, and a status-report card with one glowing block still stubbornly empty until a small reminder note appears beside it, the mascot proudly holding all three up",
        "validacao": "the mascot examining a scattered pile of glowing template cards through a large magnifying glass, several fading and outdated at the edges, no single binding document holding them together, a kind amber warning light above, a small round blank wax stamp resting unused",
        "dica": "the mascot catching a small glowing ad-hoc prompt card right as it sparkles with unexpected success, immediately folding it into a bracket-slotted template shape, behind it a large friendly launch button dimmed until the fold is complete",
        "dica_motion": "The ad-hoc prompt card sparkles brightly the instant it succeeds, the mascot swiftly folds it into a bracket-slotted template shape before the sparkle fades, the large button in the background brightens as the fold completes, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    11: {  # Fundamentos: ChatGPT organiza, mas não tem acesso a agenda/e-mail
        "sistema": "the mascot carefully stacking translucent glowing glass layers into a tower built directly from a swirl of loose scattered glowing scraps being pulled in and organized layer by layer, one dim foggy layer showing where organization is still incomplete",
        "intencao": "on one side the mascot calmly writing on a small glowing planning card, on the other side a friendly robotic arm reaching toward a locked glowing calendar icon it cannot open on its own, a clear gap of soft light between what the mascot is told and the calendar it cannot see",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from a pile of scattered scrap notes, through a stone splitting into two roles (structure vs decide), past an empty glowing destination-folder stone, through a raw-draft card stone, to a final stone where the draft is manually carried into a real notebook, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The scattered scrap pile glows and gathers first, then the two-role stone splits softly into structure and decide, the empty destination-folder stone waits dim until claimed, the raw-draft card brightens as it forms, the tiny mascot carries the glowing draft by hand onto the final stone where it settles into a real notebook, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table condensing into two crisp glowing results — a prioritized task list card with an overdue item glowing brightest at the top, and a meeting agenda card assembled from several small glowing envelope-shaped email fragments merging together, the mascot proudly holding both up before carrying them toward a real notebook",
        "validacao": "the mascot examining a glowing task list through a large magnifying glass beside a locked calendar icon that stays dark and unreachable, a kind amber warning light above, a small round blank wax stamp resting unused beside a draft that never left the glowing table",
        "dica": "the mascot writing a glowing checklist card with a clearly labeled priority-rule tag pinned to the top, behind it a large friendly launch button dimmed until the rule is explicitly set",
        "dica_motion": "The checklist card glows as a priority-rule tag is pinned firmly to its top edge, the items below reorder themselves according to the rule, the large button in the background brightens once the explicit rule is in place, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    12: {  # Configuração: Projetos separados, arquivos de referência
        "sistema": "the mascot carefully stacking translucent glowing glass layers into several separate small towers instead of one — each tower fenced off in its own glowing enclosure so a layer from one tower can never drift into another",
        "intencao": "on one side the mascot calmly writing on a small glowing planning card summarizing numbers from memory, on the other side a friendly robotic arm holding up an actual glowing spreadsheet file plugged directly into the table, a clear gap of soft light between the remembered summary and the real attached file",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from several small glowing fenced enclosures, through a stone where each enclosure gets its own instruction tablet, past a stone where real files are plugged in, through a consistent-use stone, to a final calendar-marked review stone, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "Each fenced enclosure lights up separately in sequence, then an instruction tablet settles into each one, the real file plugs in with a soft click of light, the consistent-use stone glows steadily, the tiny mascot steps onto the final calendar stone as a monthly review mark softly pulses, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table condensing into three separate crisp glowing fenced enclosures, each holding a distinct client-briefing tablet, beside a fourth enclosure holding a glowing spreadsheet that refreshes itself with a new monthly stack of numbers, the mascot proudly tending all of them",
        "validacao": "the mascot examining a single overcrowded glowing enclosure through a large magnifying glass where too many unrelated tablets are crammed together, a faded outdated spreadsheet glowing dim and stale beside it, a kind amber warning light above, a small round blank wax stamp resting unused",
        "dica": "the mascot writing a glowing checklist card that asks a direct question toward a fenced enclosure, causing every file and instruction tablet inside to briefly light up and list themselves, behind it a large friendly launch button dimmed until the inventory is confirmed",
        "dica_motion": "The checklist card glows as the question is posed, every tablet and file inside the fenced enclosure briefly lights up one by one in response, the large button in the background brightens once the full inventory is confirmed, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    13: {  # Aplicação: consolidar 3 reuniões, Projeto Aurora
        "sistema": "the mascot carefully stacking translucent glowing glass layers into a tower built from raw unfiltered scraps still bearing their rough original texture, a neighboring pre-polished smooth layer sitting empty and hollow because its important texture was sanded away before it arrived",
        "intencao": "on one side the mascot calmly writing on a small glowing planning card with four labeled empty slots — owner, deadline, status, priority — on the other side a friendly robotic arm sorting a messy pile of notes directly into those four slots, a clear gap of soft light between the defined slots and the raw pile being sorted",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from three overlapping glowing note piles, through a four-slot structure stone, past a stone splitting into decided versus open items, through a magnifying-glass stone checking owner names, to a final stone exporting into a real shared board, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The three overlapping note piles glow and merge onto the first stone, the four-slot structure stone lights each slot as data sorts in, the decided-versus-open stone splits cleanly into two glowing halves, the magnifying-glass stone brightens over a name being double-checked, the tiny mascot carries the finished plan onto the final stone where it settles into a real shared board, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table — three overlapping note piles labeled with faint different handwriting styles — condensing into one crisp glowing action-plan table with owner, deadline and status columns, one name tag flickering between two glowing initials until the mascot reaches in to correct it by hand",
        "validacao": "the mascot examining a glowing action-plan table through a large magnifying glass, one owner name tag glowing amber with uncertainty, a kind amber warning light above, a small round blank wax stamp resting unused beside a plan still trapped inside a glowing conversation bubble instead of a real board",
        "dica": "the mascot writing a glowing checklist card that stamps a small asterisk beside any owner name tag still uncertain in the action-plan table, behind it a large friendly launch button dimmed until every asterisk has been reviewed",
        "dica_motion": "The checklist card glows as small asterisks appear beside uncertain owner tags one by one, the mascot's pen circles each asterisk for review, the large button in the background brightens once every asterisk has been checked, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    14: {  # Erros/validação: cronogramas irreais, privacidade
        "sistema": "the mascot carefully stacking translucent glowing glass layers into a tower, each layer polished and perfectly aligned, but one thin layer glowing deceptively bright despite being far too short to actually support the weight the tower needs at that point",
        "intencao": "on one side the mascot calmly writing on a small glowing planning card with client names and email icons fully visible, on the other side a friendly robotic arm holding an identical card with only anonymized code numbers and revenue figures showing, a clear gap of soft light between the exposed version and the safely anonymized one",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from a stone questioning a sensitive data file, through a stone comparing a schedule against real past experience, past a stone weighing priorities against private knowledge, through a stone where the plan is questioned for weaknesses, to a final official-stamp stone, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The sensitive-data stone glows with a questioning pulse first, then the schedule stone flickers as it's measured against a longer real timeline, the priority stone glows as private knowledge is weighed in, the weakness-check stone dims and brightens as flaws surface, the tiny mascot steps onto the final official-stamp stone only once it's fully bright, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table condensing into two crisp glowing results — a client spreadsheet card where name and email columns fade to safe blank anonymized code the moment before upload, and a project schedule card where a short glowing two-day block visibly stretches and lengthens into a realistic multi-week block once corrected, the mascot proudly holding both up",
        "validacao": "the mascot examining a glowing client spreadsheet through a large magnifying glass with exposed name columns still visible, a short deceptively bright schedule block glowing beside it, a kind amber warning light above, a small round blank wax stamp resting unused",
        "dica": "the mascot writing a glowing checklist card posing a direct question to a sensitive data file, causing the file's identifying columns to fade to safe blank code, behind it a large friendly launch button dimmed until the fade completes",
        "dica_motion": "The checklist card glows as the question is posed to the data file, the file's name and email columns visibly fade into safe anonymized blanks, the large button in the background brightens once the fade is complete, warm ambient drift, slow cinematic push-in, seamless loop",
    },
    15: {  # Projeto/entrega: ritual semanal de 3 semanas
        "sistema": "the mascot placing the final translucent glowing layer on a steady completed tower each of three separate weeks, then holding up two towers side by side to compare — one glowing plan tower and one dimmer actual-outcome tower — checking how closely their heights and shapes match",
        "intencao": "on one side the mascot calmly writing on a small glowing fixed-format card with three labeled slots — pending, commitments, priorities — on the other side a friendly robotic arm adjusting one of those three slots slightly differently each week instead of leaving it frozen, a clear gap of soft light between the fixed structure and the actively adjusted content",
        "fluxo": "a winding path of five glowing stepping stones crossing the table from a fenced dedicated-project stone, through a fixed three-slot prompt card, past a stone splitting into planned-versus-actual outcomes, through an adjustment stone correcting the gap, to a final stone marked with three repeating week-cycles, the tiny mascot walking the stones mid-journey",
        "fluxo_motion": "The dedicated-project stone glows first, then the fixed three-slot prompt card lights each slot in turn, the planned-versus-actual stone splits and the two halves visibly compared side by side, the adjustment stone flickers as a correction is written in, the tiny mascot walks across three repeating week-cycle stones at the end, each brightening in sequence, warm dust motes drift, slow cinematic push-in, seamless loop",
        "cenario": "a swirl of misty crumpled paper scraps rising above the table condensing into three crisp glowing weekly-plan cards side by side — the first with two glowing task blocks awkwardly overlapping two small recurring-meeting icons, the second with the same meeting icons now clearly fenced off and respected, the third matching the second exactly, the mascot proudly holding up all three in a row",
        "validacao": "the mascot examining a single lonely week-plan card through a large magnifying glass with no second or third card beside it for comparison, a kind amber warning light above a prompt card that looks copied and unfamiliar, a small round blank wax stamp resting unused",
        "dica": "the mascot holding two glowing weekly-plan cards side by side, a shared glowing thread of light connecting the same recurring flaw visible in both, behind it a large friendly launch button dimmed until the repeating pattern is named",
        "dica_motion": "The two weekly-plan cards hover side by side as a glowing thread of light traces the same recurring flaw connecting both, the mascot circles the shared thread with a pen, the large button in the background brightens once the repeating pattern is clearly named, warm ambient drift, slow cinematic push-in, seamless loop",
    },
}

CHAPTERS = [2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15]

# ─────────────────────────────────────────────────────────────────────────
# Plumbing tecnico — copiado verbatim de generate_course_inline_media.py
# ─────────────────────────────────────────────────────────────────────────
def post(path, payload):
    req = urllib.request.Request(API + path, json.dumps(payload).encode(),
                                 {"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())

def free_vram():
    try:
        post("/free", {"unload_models": True, "free_memory": True})
        time.sleep(2)
    except Exception:
        pass

def build_image(prompt_text, prefix, seed):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
        "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1152, "height": 640, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"seed": seed, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1, "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": f"course_media/chatgpt-zero/inline/{prefix}", "images": ["8", 0]}},
    }

def build_video(input_image, motion, prefix, seed):
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "ltx-2.3-22b-dev-fp8.safetensors"}},
        "2": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "ltx-2.3-22b-distilled-lora-384.safetensors", "strength_model": 0.5}},
        "3": {"class_type": "LTXAVTextEncoderLoader", "inputs": {"text_encoder": "gemma_3_12B_it_fp4_mixed.safetensors", "ckpt_name": "ltx-2.3-22b-dev-fp8.safetensors", "device": "default"}},
        "4": {"class_type": "LatentUpscaleModelLoader", "inputs": {"model_name": "ltx-2.3-spatial-upscaler-x2-1.1.safetensors"}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": motion, "clip": ["3", 0]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": NEGATIVE, "clip": ["3", 0]}},
        "15": {"class_type": "LTXVConditioning", "inputs": {"positive": ["5", 0], "negative": ["6", 0], "frame_rate": 25}},
        "10": {"class_type": "LoadImage", "inputs": {"image": input_image}},
        "11": {"class_type": "ResizeImageMaskNode", "inputs": {"input": ["10", 0], "resize_type": "scale dimensions", "resize_type.width": 1280, "resize_type.height": 720, "resize_type.crop": "center", "scale_method": "lanczos"}},
        "12": {"class_type": "LTXVPreprocess", "inputs": {"image": ["11", 0], "img_compression": 18}},
        "20": {"class_type": "EmptyLTXVLatentVideo", "inputs": {"width": 640, "height": 360, "length": 97, "batch_size": 1}},
        "21": {"class_type": "LTXVImgToVideoInplace", "inputs": {"vae": ["1", 2], "image": ["12", 0], "latent": ["20", 0], "strength": 0.7, "bypass": False}},
        "22": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
        "23": {"class_type": "CFGGuider", "inputs": {"model": ["2", 0], "positive": ["15", 0], "negative": ["15", 1], "cfg": 1.0}},
        "24": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler_ancestral_cfg_pp"}},
        "25": {"class_type": "ManualSigmas", "inputs": {"sigmas": "1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0"}},
        "26": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["22", 0], "guider": ["23", 0], "sampler": ["24", 0], "sigmas": ["25", 0], "latent_image": ["21", 0]}},
        "30": {"class_type": "LTXVLatentUpsampler", "inputs": {"samples": ["26", 0], "upscale_model": ["4", 0], "vae": ["1", 2]}},
        "31": {"class_type": "LTXVImgToVideoInplace", "inputs": {"vae": ["1", 2], "image": ["12", 0], "latent": ["30", 0], "strength": 1.0, "bypass": False}},
        "32": {"class_type": "LTXVCropGuides", "inputs": {"positive": ["15", 0], "negative": ["15", 1], "latent": ["31", 0]}},
        "33": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed + 1}},
        "34": {"class_type": "CFGGuider", "inputs": {"model": ["2", 0], "positive": ["32", 0], "negative": ["32", 1], "cfg": 1.0}},
        "35": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler_cfg_pp"}},
        "36": {"class_type": "ManualSigmas", "inputs": {"sigmas": "0.85, 0.7250, 0.4219, 0.0"}},
        "37": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["33", 0], "guider": ["34", 0], "sampler": ["35", 0], "sigmas": ["36", 0], "latent_image": ["32", 2]}},
        "40": {"class_type": "VAEDecodeTiled", "inputs": {"samples": ["37", 0], "vae": ["1", 2], "tile_size": 768, "overlap": 64, "temporal_size": 4096, "temporal_overlap": 4}},
        "44": {"class_type": "CreateVideo", "inputs": {"images": ["40", 0], "fps": 25}},
        "45": {"class_type": "SaveVideo", "inputs": {"video": ["44", 0], "filename_prefix": f"course_media/chatgpt-zero/inline/{prefix}-video", "format": "mp4", "codec": "h264"}},
    }

def upload(path):
    data = path.read_bytes()
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="{path.name}"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode() + data + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(f"{API}/upload/image", data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    return json.loads(urllib.request.urlopen(req).read()).get("name", path.name)

def wait(pid, timeout=2400):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
            if pid in h:
                s = h[pid].get("status", {})
                if s.get("completed"):
                    return True, int(time.time() - t0)
                if s.get("status_str") == "error":
                    print(json.dumps(s)[:300], flush=True)
                    return False, int(time.time() - t0)
        except Exception:
            pass
        time.sleep(5)
    return False, timeout

# ─────────────────────────────────────────────────────────────────────────
manifest = []
prompts_audit = []

# ── Fase A: imagens (fila toda de uma vez, poll no fim) ──
free_vram()
jobs = []
for cap in CHAPTERS:
    module = (cap - 1) // 5
    setting, accent = THEMES[module]
    cap_entry = {"n": cap, "module": module, "accent": accent, "images": {}, "videos": {}}
    for si, slot in enumerate(SLOTS_IMG):
        name = f"cap{cap:02d}-{slot}"
        action = CHAPTER_DATA[cap][slot]
        prompt_text = f"{setting}, {action}, {accent} glow" + FUSION
        seed = BASE_SEED + cap * 10 + si
        cap_entry["images"][slot] = {"seed": seed, "prompt": prompt_text}
        if list(OUT_DIR.glob(f"{name}_*.png")):
            continue  # retomavel
        pid = post("/prompt", {"prompt": build_image(prompt_text, name, seed)})["prompt_id"]
        jobs.append((pid, name))
        manifest.append({"kind": "img", "name": name, "seed": seed, "prompt": prompt_text})
    prompts_audit.append(cap_entry)
print(f"IMAGENS: {len(jobs)} na fila (de {len(CHAPTERS) * len(SLOTS_IMG)} totais)", flush=True)

# salva o audit de prompts assim que montado, antes mesmo de terminar a geracao
Path(__file__).with_name("content_drafts").mkdir(exist_ok=True)
audit_path = Path(__file__).with_name("content_drafts") / "chatgpt-zero_prompts_2-15.json"

done = set()
t0 = time.time()
while len(done) < len(jobs) and time.time() - t0 < 14400:
    for pid, name in jobs:
        if pid in done:
            continue
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
            if pid in h and h[pid].get("status", {}).get("completed"):
                done.add(pid)
                if len(done) % 12 == 0 or len(done) == len(jobs):
                    print(f"img {len(done)}/{len(jobs)} — {int(time.time()-t0)}s", flush=True)
        except Exception:
            pass
    time.sleep(6)
print(f"IMAGENS OK {len(done)}/{len(jobs)}", flush=True)

# ── Fase B: videos (sequencial) ──
free_vram()
n_ok = 0
n_total_video = len(CHAPTERS) * len(SLOTS_VIDEO)
for cap in CHAPTERS:
    cap_entry = next(c for c in prompts_audit if c["n"] == cap)
    for slot in SLOTS_VIDEO:
        name = f"cap{cap:02d}-{slot}"
        motion = CHAPTER_DATA[cap][f"{slot}_motion"]
        seed = 9300 + cap * 10 + (0 if slot == "fluxo" else 5)
        cap_entry["videos"][slot] = {"seed": seed, "motion": motion}
        if list(OUT_DIR.glob(f"{name}-video_*.mp4")):
            n_ok += 1
            continue  # retomavel
        pngs = sorted(OUT_DIR.glob(f"{name}_*.png"), key=lambda p: p.stat().st_mtime)
        if not pngs:
            print(f"[vid {name}] SEM base — pulando", flush=True)
            manifest.append({"kind": "video", "name": name, "seed": seed, "ok": False, "reason": "no base image"})
            continue
        try:
            pid = post("/prompt", {"prompt": build_video(upload(pngs[-1]), motion, name, seed)})["prompt_id"]
            ok, secs = wait(pid)
        except Exception as e:
            print(f"[vid {name}] EXCEPTION {e}", flush=True)
            ok, secs = False, 0
        n_ok += 1 if ok else 0
        print(f"[vid {name}] {'OK' if ok else 'FAIL'} in {secs}s ({n_ok}/{n_total_video} videos prontos)", flush=True)
        manifest.append({"kind": "video", "name": name, "seed": seed, "ok": ok})

audit_path.write_text(json.dumps(prompts_audit, ensure_ascii=False, indent=1), encoding="utf-8")
Path(__file__).with_name("course-inline-manifest_2-15.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"COURSE INLINE MEDIA (caps 2-15) DONE — audit: {audit_path}", flush=True)
